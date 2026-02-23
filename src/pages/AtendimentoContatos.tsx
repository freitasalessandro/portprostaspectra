import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Plus, Pencil, Trash2, Phone, Mail, Building2, StickyNote, MessageCircle, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Contato {
  id: string;
  nome: string | null;
  whatsapp_number: string;
  email: string | null;
  empresa: string | null;
  notas: string | null;
  total_tickets: number;
  active_tickets: number;
  created_at: string;
  updated_at: string;
}

export default function AtendimentoContatos() {
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Contato | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [fNome, setFNome] = useState("");
  const [fNumber, setFNumber] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fEmpresa, setFEmpresa] = useState("");
  const [fNotas, setFNotas] = useState("");
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  const syncContactNames = async () => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.functions.invoke("sync-contact-names", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (data?.updated > 0) {
        toast({ title: `${data.updated} contato(s) atualizado(s)` });
        fetchContatos();
      }
    } catch {}
    setSyncing(false);
  };

  const fetchContatos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("contatos")
      .select("*, tickets(id, status)")
      .order("updated_at", { ascending: false });
    const enriched = (data || []).map((c: any) => ({
      ...c,
      active_tickets: (c.tickets || []).filter((t: any) => !["ENCERRADO", "CANCELADO"].includes(t.status)).length,
      tickets: undefined,
    }));
    setContatos(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchContatos(); syncContactNames(); }, []);

  const openSheet = (c?: Contato) => {
    if (c) {
      setEditing(c);
      setFNome(c.nome || "");
      setFNumber(c.whatsapp_number);
      setFEmail(c.email || "");
      setFEmpresa(c.empresa || "");
      setFNotas(c.notas || "");
    } else {
      setEditing(null);
      setFNome(""); setFNumber(""); setFEmail(""); setFEmpresa(""); setFNotas("");
    }
    setSheetOpen(true);
  };

  const handleSave = async () => {
    const cleanNum = fNumber.replace(/\D/g, "");
    if (!cleanNum || cleanNum.length < 10) {
      toast({ title: "Número inválido", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const payload = {
        nome: fNome || null,
        whatsapp_number: cleanNum,
        email: fEmail || null,
        empresa: fEmpresa || null,
        notas: fNotas || null,
        user_id: user.id,
      };

      if (editing) {
        const { error } = await supabase.from("contatos").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast({ title: "Contato atualizado" });
      } else {
        const { error } = await supabase.from("contatos").insert(payload);
        if (error) throw error;
        toast({ title: "Contato criado" });
      }
      setSheetOpen(false);
      fetchContatos();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("contatos").delete().eq("id", deleteId);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Contato excluído" });
      fetchContatos();
    }
    setDeleteId(null);
  };

  const filtered = contatos.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.nome?.toLowerCase().includes(s) ||
      c.whatsapp_number.includes(s) ||
      c.email?.toLowerCase().includes(s) ||
      c.empresa?.toLowerCase().includes(s)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Contatos</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              Gerencie sua base de contatos do atendimento
              {syncing && (
                <span className="inline-flex items-center gap-1 text-xs text-primary">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Sincronizando nomes…
                </span>
              )}
            </p>
          </div>
          <Button onClick={() => openSheet()} className="shrink-0">
            <Plus className="w-4 h-4 mr-2" /> Novo Contato
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, número, email ou empresa..."
            className="pl-9"
          />
        </div>

        <div className="border border-border/50 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Contato</TableHead>
                <TableHead className="text-xs hidden md:table-cell">WhatsApp</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Empresa</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Tickets</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Atualizado</TableHead>
                <TableHead className="text-xs text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="h-12">
                      <div className="h-4 bg-muted/50 rounded animate-pulse w-3/4" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum contato encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(c => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {(c.nome || c.whatsapp_number).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{c.nome || "Sem nome"}</p>
                          {c.email && <p className="text-[11px] text-muted-foreground truncate">{c.email}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                      {c.whatsapp_number}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {c.empresa ? <Badge variant="secondary" className="text-[10px]">{c.empresa}</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px]">{c.total_tickets}</Badge>
                        {c.active_tickets > 0 && (
                          <Badge className="text-[10px] bg-green-500/20 text-green-400 border-green-500/30 border" variant="outline">
                            {c.active_tickets} ativo{c.active_tickets > 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                      {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true, locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right space-x-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Ver conversas" onClick={() => navigate(`/atendimento?contato=${c.whatsapp_number}`)}>
                        <MessageCircle className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openSheet(c)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(c.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit / Create Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editing ? "Editar Contato" : "Novo Contato"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5"><Phone className="w-3 h-3" /> WhatsApp *</Label>
              <Input value={fNumber} onChange={e => setFNumber(e.target.value)} placeholder="5511999999999" className="h-9 text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Nome</Label>
              <Input value={fNome} onChange={e => setFNome(e.target.value)} placeholder="João Silva" className="h-9 text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5"><Mail className="w-3 h-3" /> Email</Label>
              <Input value={fEmail} onChange={e => setFEmail(e.target.value)} placeholder="joao@empresa.com" className="h-9 text-sm" type="email" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5"><Building2 className="w-3 h-3" /> Empresa</Label>
              <Input value={fEmpresa} onChange={e => setFEmpresa(e.target.value)} placeholder="Empresa LTDA" className="h-9 text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5"><StickyNote className="w-3 h-3" /> Notas</Label>
              <Textarea value={fNotas} onChange={e => setFNotas(e.target.value)} placeholder="Observações sobre o contato..." className="text-sm min-h-[80px]" />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir contato?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Tickets associados não serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
