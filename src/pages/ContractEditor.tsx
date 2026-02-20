import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Send, FileText, Loader2, Variable, ChevronDown } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { motion, AnimatePresence } from "framer-motion";

const CONTRACT_VARIABLES = [
  { key: "{{cliente}}", label: "Cliente", group: "Geral" },
  { key: "{{data_hoje}}", label: "Data Atual", group: "Geral" },
  { key: "{{projeto}}", label: "Projeto", group: "Geral" },
  { key: "{{valor}}", label: "Valor", group: "Geral" },
  { key: "{{nome_completo}}", label: "Nome Completo", group: "PF" },
  { key: "{{cpf}}", label: "CPF", group: "PF" },
  { key: "{{nascimento}}", label: "Data de Nascimento", group: "PF" },
  { key: "{{razao_social}}", label: "Razão Social", group: "PJ" },
  { key: "{{cnpj}}", label: "CNPJ", group: "PJ" },
  { key: "{{inscricao_estadual}}", label: "Inscrição Estadual", group: "PJ" },
  { key: "{{representante_legal}}", label: "Representante Legal", group: "PJ" },
  { key: "{{cpf_representante}}", label: "CPF do Representante", group: "PJ" },
  { key: "{{endereco}}", label: "Endereço", group: "Endereço" },
  { key: "{{cidade}}", label: "Cidade", group: "Endereço" },
  { key: "{{estado}}", label: "Estado", group: "Endereço" },
  { key: "{{cep}}", label: "CEP", group: "Endereço" },
];

const generateSlug = (title: string) => {
  const base = title
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
};

const ContractEditor = () => {
  const { id } = useParams();
  const isNew = id === "novo";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [title, setTitle] = useState("Novo Contrato");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [status, setStatus] = useState("draft");
  const [slug, setSlug] = useState<string | null>(null);
  const [contractId, setContractId] = useState<string | null>(isNew ? null : id || null);
  const [showVariables, setShowVariables] = useState(false);
  const variablesRef = useRef<HTMLDivElement>(null);
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: "<p>Escreva o conteúdo do contrato aqui...</p>",
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none min-h-[400px] focus:outline-none px-6 py-4 font-body text-sm leading-relaxed",
      },
    },
  });

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      if (!isNew && id) loadContract();
      else setLoading(false);
    };
    init();
  }, [id, navigate, isNew]);

  const loadContract = async () => {
    const { data, error } = await supabase.from("contracts").select("*").eq("id", id).single();
    if (error || !data) { toast({ title: "Contrato não encontrado", variant: "destructive" }); navigate("/admin/contratos"); return; }
    const c = data as any;
    setTitle(c.title);
    setClientName(c.client_name || "");
    setClientPhone(c.whatsapp_number || "");
    setStatus(c.status);
    setSlug(c.slug);
    setContractId(c.id);
    if (editor && c.content && Object.keys(c.content).length > 0) {
      // Check for prefill HTML from localStorage (generated from proposal)
      const prefillKey = `contract_prefill_${c.id}`;
      const prefillHtml = localStorage.getItem(prefillKey);
      if (prefillHtml) {
        editor.commands.setContent(prefillHtml);
        localStorage.removeItem(prefillKey);
      } else {
        editor.commands.setContent(c.content);
      }
    } else if (editor) {
      // Check localStorage prefill even when content is empty
      const prefillKey = `contract_prefill_${c.id}`;
      const prefillHtml = localStorage.getItem(prefillKey);
      if (prefillHtml) {
        editor.commands.setContent(prefillHtml);
        localStorage.removeItem(prefillKey);
      }
    }
    setLoading(false);
  };

  // Also check prefill on editor ready for new contracts
  useEffect(() => {
    if (editor && contractId && !isNew) {
      const prefillKey = `contract_prefill_${contractId}`;
      const prefillHtml = localStorage.getItem(prefillKey);
      if (prefillHtml) {
        editor.commands.setContent(prefillHtml);
        localStorage.removeItem(prefillKey);
      }
    }
  }, [editor, contractId, isNew]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) { toast({ title: "Informe o título", variant: "destructive" }); return; }
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }

    const content = editor?.getJSON() || {};

    if (contractId && !isNew) {
      const { error } = await supabase.from("contracts").update({
        title: title.trim(),
        client_name: clientName.trim() || null,
        whatsapp_number: clientPhone.trim() || null,
        content,
      } as any).eq("id", contractId);
      if (error) toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      else toast({ title: "Contrato salvo!" });
    } else {
      const { data, error } = await supabase.from("contracts").insert({
        user_id: session.user.id,
        title: title.trim(),
        client_name: clientName.trim() || null,
        whatsapp_number: clientPhone.trim() || null,
        content,
      } as any).select("id").single();
      if (error) toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
      else {
        setContractId(data.id);
        toast({ title: "Contrato criado!" });
        navigate(`/admin/contratos/${data.id}`, { replace: true });
      }
    }
    setSaving(false);
  }, [title, clientName, clientPhone, editor, contractId, isNew, navigate]);

  const handleSend = async () => {
    if (!title.trim()) { toast({ title: "Informe o título", variant: "destructive" }); return; }
    if (!clientPhone.trim()) { toast({ title: "Informe o WhatsApp do cliente", variant: "destructive" }); return; }
    setSending(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }

    const content = editor?.getJSON() || {};
    const contractSlug = slug || generateSlug(title);

    if (contractId && !isNew) {
      const { error } = await supabase.from("contracts").update({
        title: title.trim(),
        client_name: clientName.trim() || null,
        whatsapp_number: clientPhone.trim() || null,
        content,
        status: "sent",
        slug: contractSlug,
      } as any).eq("id", contractId);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); setSending(false); return; }
    } else {
      const { data, error } = await supabase.from("contracts").insert({
        user_id: session.user.id,
        title: title.trim(),
        client_name: clientName.trim() || null,
        whatsapp_number: clientPhone.trim() || null,
        content,
        status: "sent",
        slug: contractSlug,
      } as any).select("id, access_code").single();
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); setSending(false); return; }
      setContractId(data.id);
    }

    // Fetch access_code
    const { data: contractData } = await supabase.from("contracts").select("access_code").eq("id", contractId || "").single();
    const accessCode = (contractData as any)?.access_code || "";

    setStatus("sent");
    setSlug(contractSlug);

    // Send WhatsApp
    const link = `${window.location.origin}/contrato/${contractSlug}`;
    const message = `Olá${clientName ? ` ${clientName}` : ""}! Seu contrato "${title}" está disponível para assinatura.\n\n🔗 Link: ${link}\n🔒 Código de acesso: ${accessCode}\n\nAcesse o link acima e utilize o código para visualizar e assinar o contrato.`;

    try {
      await supabase.functions.invoke("send-whatsapp", {
        body: { to: clientPhone.trim(), message, event: "contrato_enviado" },
      });
      // Fire contract triggers
      await supabase.functions.invoke("fire-trigger", {
        body: { contract_id: contractId, event: "contrato_enviado" },
      });
      toast({ title: "Contrato enviado via WhatsApp!" });
    } catch {
      toast({ title: "Contrato salvo mas falha ao enviar WhatsApp", variant: "destructive" });
    }

    setSending(false);
  };

  const handleGeneratePdf = async () => {
    if (!editor) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    const content = editor.getText();
    const lines = doc.splitTextToSize(content, 180);
    let y = 20;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    for (const line of lines) {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(line, 15, y);
      y += 6;
    }

    doc.save(`${title || "contrato"}.pdf`);
    toast({ title: "PDF gerado!" });
  };

  if (loading) return <AdminLayout><div className="text-center text-muted-foreground/40 py-20 font-body text-sm">Carregando...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/contratos")} className="text-muted-foreground/40 hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <p className="text-primary/60 tracking-[0.3em] uppercase text-[11px] mb-1 font-body flex items-center gap-2">
                <span className="w-6 h-px bg-primary/40" />
                {isNew ? "Novo contrato" : "Editar contrato"}
              </p>
              <h1 className="font-display text-2xl font-extrabold tracking-tight">{title || "Contrato"}</h1>
            </div>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground/60 font-display">Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground/60 font-display">Cliente</Label>
              <Input value={clientName} onChange={(e) => setClientName(e.target.value)} className="mt-1" placeholder="Nome do cliente" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground/60 font-display">WhatsApp</Label>
              <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="mt-1" placeholder="5582999999999" />
            </div>
          </div>

          {/* Editor */}
          <div className="glass-card-premium rounded-lg overflow-hidden mb-6">
            {/* Toolbar */}
            {editor && (
              <div className="flex flex-wrap gap-1 p-2 border-b border-border/30 bg-card/30">
                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} label="B" className="font-bold" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} label="I" className="italic" />
                <div className="w-px h-6 bg-border/30 mx-1 self-center" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} label="H1" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} label="H2" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} label="H3" />
                <div className="w-px h-6 bg-border/30 mx-1 self-center" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} label="• Lista" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} label="1. Lista" />
                <div className="w-px h-6 bg-border/30 mx-1 self-center" />
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} label="⫷" />
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} label="⫿" />
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} label="⫸" />
                <div className="w-px h-6 bg-border/30 mx-1 self-center" />
                <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} label="― HR" />
                <div className="w-px h-6 bg-border/30 mx-1 self-center" />
                {/* Variables dropdown */}
                <div className="relative" ref={variablesRef}>
                  <button
                    type="button"
                    onClick={() => setShowVariables(!showVariables)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-body transition-colors ${
                      showVariables ? "bg-primary/20 text-primary" : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Variable className="w-3.5 h-3.5" />
                    Variáveis
                    <ChevronDown className={`w-3 h-3 transition-transform ${showVariables ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {showVariables && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-1 z-50 w-64 max-h-72 overflow-y-auto rounded-lg border border-border/30 bg-card shadow-xl p-2"
                      >
                        {["Geral", "PF", "PJ", "Endereço"].map((group) => (
                          <div key={group} className="mb-2 last:mb-0">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-display px-2 py-1">{group}</p>
                            <div className="flex flex-wrap gap-1">
                              {CONTRACT_VARIABLES.filter(v => v.group === group).map((v) => (
                                <button
                                  key={v.key}
                                  type="button"
                                  onClick={() => {
                                    editor.chain().focus().insertContent(v.key).run();
                                    setShowVariables(false);
                                  }}
                                  className="px-2 py-0.5 rounded bg-muted/40 text-xs font-mono text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors"
                                >
                                  {v.key}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                        <p className="text-[9px] text-muted-foreground/30 font-body px-2 pt-1 border-t border-border/10 mt-1">
                          Variáveis serão substituídas pelos dados do cliente na visualização do contrato.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
            <EditorContent editor={editor} />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSave} disabled={saving} className="font-display uppercase tracking-[0.2em] text-[10px]">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar
            </Button>
            <Button onClick={handleGeneratePdf} variant="outline" className="font-display uppercase tracking-[0.2em] text-[10px]">
              <FileText className="w-4 h-4 mr-2" /> Gerar PDF
            </Button>
            <Button onClick={handleSend} disabled={sending} variant="secondary" className="font-display uppercase tracking-[0.2em] text-[10px]">
              {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Enviar para Assinar
            </Button>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

const ToolbarButton = ({ onClick, active, label, className = "" }: { onClick: () => void; active: boolean; label: string; className?: string }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-2.5 py-1 rounded text-xs font-body transition-colors ${className} ${
      active ? "bg-primary/20 text-primary" : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/50"
    }`}
  >
    {label}
  </button>
);

export default ContractEditor;
