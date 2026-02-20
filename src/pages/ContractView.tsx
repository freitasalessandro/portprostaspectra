import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Camera, Upload, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import spectraLogo from "@/assets/spectra-logo.svg";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";

const ContractView = () => {
  const { id } = useParams();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Access code
  const [accessVerified, setAccessVerified] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [accessError, setAccessError] = useState("");
  const [accessAttempts, setAccessAttempts] = useState(0);
  const [accessLocked, setAccessLocked] = useState(false);
  const [accessLockEnd, setAccessLockEnd] = useState<number | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Sign modal
  const [showSignModal, setShowSignModal] = useState(false);
  const [signStep, setSignStep] = useState(1);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [signerName, setSignerName] = useState("");
  const [signerAgreed, setSignerAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signatureHash, setSignatureHash] = useState<string | null>(null);

  // Camera
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraMode, setCameraMode] = useState<"selfie" | "doc" | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Read-only editor for display
  const editor = useEditor({
    extensions: [StarterKit, TextAlign.configure({ types: ["heading", "paragraph"] })],
    editable: false,
    content: "",
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none px-6 py-4 font-body text-sm leading-relaxed",
      },
    },
  });

  // Check cookie
  useEffect(() => {
    const cookie = document.cookie.split(";").find(c => c.trim().startsWith(`contract_access_${id}=`));
    if (cookie) setAccessVerified(true);
  }, [id]);

  // Lock timer
  useEffect(() => {
    if (!accessLockEnd) return;
    const interval = setInterval(() => {
      if (Date.now() >= accessLockEnd) { setAccessLocked(false); setAccessLockEnd(null); setAccessAttempts(0); }
    }, 1000);
    return () => clearInterval(interval);
  }, [accessLockEnd]);

  const handleVerifyCode = async () => {
    if (accessLocked || verifying) return;
    setVerifying(true);
    setAccessError("");
    try {
      // Use same edge function but query contracts table
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-access-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ proposal_identifier: id, code: accessCode, type: "contract" }),
      });
      const data = await res.json();
      if (data.valid) {
        setAccessVerified(true);
        document.cookie = `contract_access_${id}=1; path=/; SameSite=Strict`;
        // Fire contract viewed trigger
        try {
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fire-trigger`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
            body: JSON.stringify({ contract_id: data.contract_id || id, event: "contrato_visualizado" }),
          });
        } catch {}
      } else {
        const newAttempts = accessAttempts + 1;
        setAccessAttempts(newAttempts);
        if (newAttempts >= 3) {
          setAccessLocked(true);
          setAccessLockEnd(Date.now() + 30000);
          setAccessError("Muitas tentativas. Aguarde 30 segundos.");
        } else {
          setAccessError("Código incorreto. Tente novamente.");
        }
      }
    } catch { setAccessError("Erro ao verificar."); }
    setVerifying(false);
  };

  // Replace {{variables}} in tiptap JSON content
  const replaceVariablesInContent = useCallback((content: any, vars: Record<string, string>): any => {
    if (!content) return content;
    if (typeof content === "string") {
      let result = content;
      for (const [key, value] of Object.entries(vars)) {
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value || "");
      }
      return result;
    }
    if (Array.isArray(content)) return content.map(item => replaceVariablesInContent(item, vars));
    if (typeof content === "object") {
      const result: any = {};
      for (const [k, v] of Object.entries(content)) {
        result[k] = replaceVariablesInContent(v, vars);
      }
      return result;
    }
    return content;
  }, []);

  // Load contract
  useEffect(() => {
    if (!accessVerified) return;
    const load = async () => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || "");
      let query = supabase.from("public_contracts" as any).select("*");
      if (isUuid) query = query.eq("id", id);
      else query = query.eq("slug", id);
      const { data, error } = await query.single();
      if (error || !data) { setNotFound(true); setLoading(false); return; }
      setContract(data);

      // Fetch contract_data from linked proposal signature
      let contractVars: Record<string, string> = {
        cliente: (data as any).client_name || "",
        data_hoje: new Date().toLocaleDateString("pt-BR"),
      };

      const proposalId = (data as any).proposal_id;
      if (proposalId) {
        const { data: sigData } = await supabase
          .from("proposal_signatures")
          .select("contract_data")
          .eq("proposal_id", proposalId)
          .order("signed_at", { ascending: false })
          .limit(1);
        if (sigData?.[0]?.contract_data) {
          const cd = sigData[0].contract_data as Record<string, any>;
          Object.entries(cd).forEach(([k, v]) => {
            if (typeof v === "string") contractVars[k] = v;
          });
          if (cd.client_type === "pj" && cd.razao_social) contractVars.cliente = cd.razao_social;
        }
        // Also get proposal info for project/valor
        const { data: propData } = await supabase
          .from("public_proposals" as any)
          .select("project_title, total_value")
          .eq("id", proposalId)
          .maybeSingle();
        if (propData) {
          contractVars.projeto = (propData as any).project_title || "";
          contractVars.valor = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number((propData as any).total_value || 0));
        }
      }

      if (editor && (data as any).content) {
        const processedContent = replaceVariablesInContent((data as any).content, contractVars);
        editor.commands.setContent(processedContent);
      }
      setLoading(false);
    };
    load();
  }, [id, accessVerified, editor, replaceVariablesInContent]);

  // Camera helpers
  const startCamera = async (mode: "selfie" | "doc") => {
    setCameraMode(mode);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode === "selfie" ? "user" : "environment" },
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch {
      toast({ title: "Não foi possível acessar a câmera", variant: "destructive" });
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `${cameraMode}-${Date.now()}.jpg`, { type: "image/jpeg" });
      const preview = URL.createObjectURL(blob);
      if (cameraMode === "selfie") { setSelfieFile(file); setSelfiePreview(preview); }
      else { setDocFile(file); setDocPreview(preview); }
      stopCamera();
    }, "image/jpeg", 0.85);
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraActive(false);
    setCameraMode(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, mode: "selfie" | "doc") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    if (mode === "selfie") { setSelfieFile(file); setSelfiePreview(preview); }
    else { setDocFile(file); setDocPreview(preview); }
  };

  const handleSign = async () => {
    if (!signerName.trim() || !signerAgreed || !selfieFile || !docFile || !contract) return;
    setSigning(true);
    try {
      // Get IP
      let ip = "unknown";
      try { const r = await fetch("https://api.ipify.org?format=json"); ip = (await r.json()).ip; } catch {}

      const userAgent = navigator.userAgent;
      const timestamp = new Date().toISOString();
      const contractId = contract.id;

      // Upload files
      const selfPath = `${contractId}/selfie-${Date.now()}.jpg`;
      const docPath = `${contractId}/doc-${Date.now()}.jpg`;

      const [selfUpload, docUpload] = await Promise.all([
        supabase.storage.from("contract-signatures").upload(selfPath, selfieFile),
        supabase.storage.from("contract-signatures").upload(docPath, docFile),
      ]);

      if (selfUpload.error || docUpload.error) {
        toast({ title: "Erro ao enviar imagens", variant: "destructive" });
        setSigning(false);
        return;
      }

      // Generate hash
      const hashInput = `${contractId}${ip}${timestamp}${signerName.trim()}`;
      const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(hashInput));
      const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

      // Save signature
      const { error: sigError } = await supabase.from("contract_signatures").insert({
        contract_id: contractId,
        signer_name: signerName.trim(),
        selfie_path: selfPath,
        document_path: docPath,
        ip_address: ip,
        user_agent: userAgent,
        signature_hash: hashHex,
        signed_at: timestamp,
      } as any);

      if (sigError) {
        toast({ title: "Erro ao registrar assinatura", description: sigError.message, variant: "destructive" });
        setSigning(false);
        return;
      }

      // Update contract status via direct update (using public policy)
      // We need an edge function or RPC for this — use fire-trigger pattern
      // For now update via the view won't work, so we rely on a simple approach
      // Actually we can't update without auth. Let's use verify-access-code to also handle signing
      // Simplest: call an edge function
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-access-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ contract_id: contractId, action: "sign" }),
      });

      // Fire contract signed trigger
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fire-trigger`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({ contract_id: contractId, event: "contrato_assinado" }),
        });
      } catch {}

      setSignatureHash(hashHex);
      setContract({ ...contract, status: "signed" });
      setShowSignModal(false);
      toast({ title: "Contrato assinado com sucesso!" });
    } catch (e) {
      console.error(e);
      toast({ title: "Erro inesperado", variant: "destructive" });
    }
    setSigning(false);
  };

  // Access code screen
  if (!accessVerified) {
    const lockSecondsLeft = accessLockEnd ? Math.max(0, Math.ceil((accessLockEnd - Date.now()) / 1000)) : 0;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center">
          <img src={spectraLogo} alt="Spectra" className="w-10 h-auto mx-auto mb-6 opacity-70" />
          <h2 className="font-display text-xl font-bold mb-1 text-foreground">Acesso Protegido</h2>
          <p className="text-muted-foreground text-sm font-body mb-6">Digite o código de acesso para visualizar este contrato.</p>
          <div className="flex flex-col gap-3">
            <input
              type="text" inputMode="numeric" maxLength={6} value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
              placeholder="000000"
              className="h-12 text-center text-2xl tracking-[0.5em] font-mono border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/30"
              disabled={accessLocked}
            />
            <button
              onClick={handleVerifyCode}
              disabled={accessCode.length < 6 || accessLocked || verifying}
              className="h-11 rounded-lg bg-primary text-primary-foreground font-display text-sm font-bold uppercase tracking-widest disabled:opacity-40 transition-opacity"
            >
              {verifying ? "Verificando..." : accessLocked ? `Aguarde ${lockSecondsLeft}s` : "Confirmar"}
            </button>
            {accessError && <p className="text-destructive text-xs font-body">{accessError}</p>}
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground font-body">Carregando contrato...</div>;
  if (notFound || !contract) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold mb-2">Contrato não encontrado</h1>
        <p className="text-muted-foreground font-body">Este link pode estar inválido.</p>
      </div>
    </div>
  );

  const isSigned = contract.status === "signed";

  return (
    <div className="min-h-screen bg-background pb-20 antialiased">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 backdrop-blur-2xl bg-background/70 border-b border-border/10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={spectraLogo} alt="Spectra" className="w-6 h-4.5 opacity-80" />
            <span className="font-display text-sm font-extrabold tracking-tight text-foreground/80">SPECTRA</span>
          </div>
          {isSigned && (
            <span className="text-[10px] uppercase tracking-widest font-bold text-green-400 bg-green-500/10 px-3 py-1 rounded-sm flex items-center gap-1.5">
              <Check className="w-3 h-3" /> Assinado
            </span>
          )}
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-extrabold tracking-tight mb-2">{contract.title}</h1>
          {contract.client_name && <p className="text-muted-foreground font-body mb-8">{contract.client_name}</p>}

          <div className="glass-card-premium rounded-lg overflow-hidden mb-8">
            <EditorContent editor={editor} />
          </div>

          {/* Sign button or confirmation */}
          {isSigned && signatureHash ? (
            <div className="glass-card-premium p-6 rounded-lg border-green-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Check className="w-5 h-5 text-green-400" />
                <h3 className="font-display font-bold text-green-400">Contrato Assinado</h3>
              </div>
              <p className="text-sm text-muted-foreground font-body mb-2">Protocolo de assinatura:</p>
              <code className="text-xs font-mono text-primary break-all select-all">{signatureHash.substring(0, 16).toUpperCase()}</code>
            </div>
          ) : !isSigned && (
            <button
              onClick={() => { setShowSignModal(true); setSignStep(1); }}
              className="w-full h-14 rounded-lg bg-primary text-primary-foreground font-display text-sm font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors"
            >
              Assinar Contrato
            </button>
          )}
        </motion.div>
      </div>

      {/* Sign Modal */}
      <Dialog open={showSignModal} onOpenChange={(open) => { if (!open) { stopCamera(); setShowSignModal(false); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {signStep === 1 && "Etapa 1 — Selfie"}
              {signStep === 2 && "Etapa 2 — Documento"}
              {signStep === 3 && "Etapa 3 — Confirmação"}
            </DialogTitle>
          </DialogHeader>

          {/* Camera view */}
          {cameraActive && (
            <div className="relative">
              <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg" />
              <div className="flex gap-2 mt-3">
                <button onClick={capturePhoto} className="flex-1 h-10 bg-primary text-primary-foreground rounded-lg font-display text-xs uppercase tracking-widest font-bold">
                  <Camera className="w-4 h-4 inline mr-2" /> Capturar
                </button>
                <button onClick={stopCamera} className="h-10 px-4 border border-border rounded-lg text-muted-foreground text-xs">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Selfie */}
          {signStep === 1 && !cameraActive && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground font-body">Tire uma selfie para validar sua identidade.</p>
              {selfiePreview ? (
                <div className="relative">
                  <img src={selfiePreview} alt="Selfie" className="w-full rounded-lg" />
                  <button onClick={() => { setSelfieFile(null); setSelfiePreview(null); }} className="absolute top-2 right-2 bg-background/80 rounded-full p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => startCamera("selfie")} className="flex-1 h-20 border border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors">
                    <Camera className="w-5 h-5" />
                    <span className="text-xs">Câmera</span>
                  </button>
                  <label className="flex-1 h-20 border border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors cursor-pointer">
                    <Upload className="w-5 h-5" />
                    <span className="text-xs">Upload</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "selfie")} />
                  </label>
                </div>
              )}
              <button
                onClick={() => setSignStep(2)}
                disabled={!selfieFile}
                className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-display text-xs uppercase tracking-widest font-bold disabled:opacity-40"
              >
                Próximo
              </button>
            </div>
          )}

          {/* Step 2: Document */}
          {signStep === 2 && !cameraActive && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground font-body">Fotografe ou envie uma imagem do seu RG ou CNH.</p>
              {docPreview ? (
                <div className="relative">
                  <img src={docPreview} alt="Documento" className="w-full rounded-lg" />
                  <button onClick={() => { setDocFile(null); setDocPreview(null); }} className="absolute top-2 right-2 bg-background/80 rounded-full p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => startCamera("doc")} className="flex-1 h-20 border border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors">
                    <Camera className="w-5 h-5" />
                    <span className="text-xs">Câmera</span>
                  </button>
                  <label className="flex-1 h-20 border border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors cursor-pointer">
                    <Upload className="w-5 h-5" />
                    <span className="text-xs">Upload</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "doc")} />
                  </label>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setSignStep(1)} className="flex-1 h-10 border border-border rounded-lg text-muted-foreground text-xs font-display uppercase tracking-widest">Voltar</button>
                <button
                  onClick={() => setSignStep(3)}
                  disabled={!docFile}
                  className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground font-display text-xs uppercase tracking-widest font-bold disabled:opacity-40"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {signStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-widest text-muted-foreground/60 font-display block mb-1">Nome Completo</label>
                <input
                  type="text" value={signerName} onChange={(e) => setSignerName(e.target.value)}
                  className="w-full h-10 px-3 border border-border rounded-lg bg-background text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Seu nome completo"
                />
              </div>
              <div className="flex items-start gap-2">
                <Checkbox checked={signerAgreed} onCheckedChange={(v) => setSignerAgreed(v === true)} id="agree" />
                <label htmlFor="agree" className="text-xs text-muted-foreground font-body leading-relaxed cursor-pointer">
                  Declaro que li e concordo com todos os termos deste contrato. Confirmo que as informações fornecidas são verdadeiras.
                </label>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSignStep(2)} className="flex-1 h-10 border border-border rounded-lg text-muted-foreground text-xs font-display uppercase tracking-widest">Voltar</button>
                <button
                  onClick={handleSign}
                  disabled={!signerName.trim() || !signerAgreed || signing}
                  className="flex-1 h-10 rounded-lg bg-green-600 text-white font-display text-xs uppercase tracking-widest font-bold disabled:opacity-40"
                >
                  {signing ? "Assinando..." : "Confirmar Assinatura"}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractView;
