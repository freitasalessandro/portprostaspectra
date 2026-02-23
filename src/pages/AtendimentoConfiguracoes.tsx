import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Check, Wifi, WifiOff, Copy, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Motivo {
  id: string;
  nome: string;
  descricao: string | null;
  sla_minutos: number;
  prioridade: string;
  cor_hex: string;
  ativo: boolean;
  user_id: string;
}

interface Atendente {
  id: string;
  nome_completo: string;
  setor: string | null;
  assinatura_padrao: string | null;
  assinatura_ativa: boolean;
  max_tickets: number;
  disponivel: boolean;
  user_id: string;
}

export default function AtendimentoConfiguracoes() {
  const { toast } = useToast();
  const [motivos, setMotivos] = useState<Motivo[]>([]);
  const [atendentes, setAtendentes] = useState<Atendente[]>([]);
  const [motivoSheet, setMotivoSheet] = useState(false);
  const [atendenteSheet, setAtendenteSheet] = useState(false);
  const [editMotivo, setEditMotivo] = useState<Motivo | null>(null);
  const [editAtendente, setEditAtendente] = useState<Atendente | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Minha assinatura
  const [meuPerfil, setMeuPerfil] = useState<Atendente | null>(null);
  const [sigPreview, setSigPreview] = useState("");

  // WhatsApp config
  const [waUrl, setWaUrl] = useState("");
  const [waInstance, setWaInstance] = useState("");
  const [waKey, setWaKey] = useState("");
  const [waConnected, setWaConnected] = useState<boolean | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ imported: number; skipped: number; total: number } | null>(null);

  // Respostas rápidas
  interface RespostaRapida { id: string; nome: string; conteudo: string; categoria: string; ativo: boolean; user_id: string; }
  const [respostas, setRespostas] = useState<RespostaRapida[]>([]);
  const [respostaSheet, setRespostaSheet] = useState(false);
  const [editResposta, setEditResposta] = useState<RespostaRapida | null>(null);
  const [rNome, setRNome] = useState("");
  const [rConteudo, setRConteudo] = useState("");
  const [rCategoria, setRCategoria] = useState("Geral");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchMotivos();
    fetchAtendentes();
    fetchMeuPerfil();
    fetchWaConfig();
    fetchRespostas();
  }, [userId]);

  const seedMotivos = async () => {
    if (!userId) return;
    const { count } = await supabase.from("motivos_atendimento").select("*", { count: "exact", head: true }).eq("user_id", userId);
    if ((count || 0) > 0) return;
    const defaults = [
      { nome: "Suporte Técnico", descricao: "Problemas técnicos em produtos SaaS (FlowList, Forms, Contrato Online, YnasAPS)", sla_minutos: 60, prioridade: "1" as const, cor_hex: "#EF4444" },
      { nome: "Dúvidas sobre Produto", descricao: "Perguntas sobre funcionalidades, planos e uso dos produtos Spectra", sla_minutos: 120, prioridade: "2" as const, cor_hex: "#3B82F6" },
      { nome: "Solicitação de Feature", descricao: "Pedidos de novas funcionalidades ou melhorias em produtos existentes", sla_minutos: 1440, prioridade: "3" as const, cor_hex: "#8B5CF6" },
      { nome: "Comercial / Proposta", descricao: "Interesse em novos projetos, propostas comerciais e Diagnóstico Estratégico", sla_minutos: 30, prioridade: "1" as const, cor_hex: "#10B981" },
      { nome: "Financeiro / Contrato", descricao: "Questões sobre pagamentos, faturas e contratos ativos", sla_minutos: 240, prioridade: "2" as const, cor_hex: "#F59E0B" },
      { nome: "Projeto sob Medida", descricao: "Acompanhamento de projetos customizados em desenvolvimento", sla_minutos: 480, prioridade: "2" as const, cor_hex: "#06B6D4" },
      { nome: "Bug / Incidente", descricao: "Relato de bugs críticos ou incidentes em produção", sla_minutos: 30, prioridade: "1" as const, cor_hex: "#DC2626" },
      { nome: "Onboarding", descricao: "Implantação e treinamento inicial de novos clientes", sla_minutos: 480, prioridade: "3" as const, cor_hex: "#6366F1" },
    ];
    await supabase.from("motivos_atendimento").insert(defaults.map(m => ({ ...m, user_id: userId })));
  };

  const seedRespostas = async () => {
    if (!userId) return;
    const { count } = await (supabase.from("respostas_rapidas" as any).select("*", { count: "exact", head: true }).eq("user_id", userId) as any);
    if ((count || 0) > 0) return;
    const defaults = [
      { nome: "Boas-vindas", conteudo: "Olá! 👋 Seja bem-vindo ao suporte Spectra. Como posso ajudá-lo hoje?", categoria: "Saudação" },
      { nome: "Aguarde um momento", conteudo: "Estou verificando essa questão para você. Um momento, por favor! ⏳", categoria: "Saudação" },
      { nome: "Solicitar detalhes", conteudo: "Para que eu possa ajudá-lo melhor, poderia me enviar mais detalhes sobre o problema? (prints, mensagens de erro, qual produto está usando)", categoria: "Suporte" },
      { nome: "Bug recebido", conteudo: "Obrigado pelo relato! Registrei esse bug internamente e nossa equipe já está analisando. Retorno com uma atualização em breve.", categoria: "Suporte" },
      { nome: "Problema resolvido", conteudo: "O problema foi corrigido! ✅ Poderia confirmar se está tudo funcionando corretamente do seu lado?", categoria: "Suporte" },
      { nome: "Encaminhar comercial", conteudo: "Vou encaminhar sua solicitação para nosso time comercial. Em breve entrarão em contato para agendar um Diagnóstico Estratégico gratuito! 🚀", categoria: "Comercial" },
      { nome: "Proposta enviada", conteudo: "Sua proposta foi enviada! 📄 Você pode acessá-la pelo link que enviei. Qualquer dúvida sobre os termos, estou à disposição.", categoria: "Comercial" },
      { nome: "Contrato disponível", conteudo: "Seu contrato está disponível para assinatura digital! 📝 Acesse pelo link enviado e siga as instruções. É rápido e seguro.", categoria: "Comercial" },
      { nome: "Atualização de projeto", conteudo: "Segue atualização do seu projeto: estamos na fase de [FASE]. Previsão de entrega da próxima etapa: [DATA].", categoria: "Projeto" },
      { nome: "Encerramento", conteudo: "Agradeço o contato! Se precisar de algo mais, estou à disposição. Tenha um ótimo dia! 😊", categoria: "Encerramento" },
      { nome: "Fora do horário", conteudo: "Nosso horário de atendimento é de segunda a sexta, das 9h às 18h. Registramos sua mensagem e retornaremos no próximo dia útil!", categoria: "Encerramento" },
      { nome: "NPS / Avaliação", conteudo: "Sua opinião é muito importante! De 0 a 10, como avalia o atendimento recebido? 📊", categoria: "Encerramento" },
    ];
    await (supabase.from("respostas_rapidas" as any).insert(defaults.map(r => ({ ...r, user_id: userId }))) as any);
  };

  const fetchRespostas = async () => {
    if (!userId) return;
    await seedRespostas();
    const { data } = await (supabase.from("respostas_rapidas" as any).select("*").eq("user_id", userId).order("nome") as any);
    if (data) setRespostas(data);
  };

  const fetchMotivos = async () => {
    if (!userId) return;
    await seedMotivos();
    const { data } = await supabase.from("motivos_atendimento").select("*").eq("user_id", userId).order("nome");
    if (data) setMotivos(data as Motivo[]);
  };

  const fetchAtendentes = async () => {
    const { data } = await supabase.from("atendentes_perfil").select("*").order("nome_completo");
    if (data) setAtendentes(data as Atendente[]);
  };

  const fetchMeuPerfil = async () => {
    if (!userId) return;
    const { data } = await supabase.from("atendentes_perfil").select("*").eq("id", userId).maybeSingle();
    if (data) {
      setMeuPerfil(data as Atendente);
      setSigPreview(data.assinatura_padrao || "");
    }
  };

  const fetchWaConfig = async () => {
    if (!userId) return;
    const { data } = await supabase.from("company_settings").select("atendimento_api_url, atendimento_api_instance, atendimento_api_token").eq("user_id", userId).maybeSingle();
    if (data) {
      setWaUrl((data as any).atendimento_api_url || "");
      setWaInstance((data as any).atendimento_api_instance || "");
      setWaKey((data as any).atendimento_api_token || "");
    }
  };

  // Motivo form
  const [mNome, setMNome] = useState("");
  const [mDesc, setMDesc] = useState("");
  const [mSla, setMSla] = useState("60");
  const [mPrio, setMPrio] = useState("2");
  const [mCor, setMCor] = useState("#3B82F6");

  const openMotivoSheet = (m?: Motivo) => {
    if (m) {
      setEditMotivo(m);
      setMNome(m.nome);
      setMDesc(m.descricao || "");
      setMSla(String(m.sla_minutos));
      setMPrio(m.prioridade);
      setMCor(m.cor_hex);
    } else {
      setEditMotivo(null);
      setMNome(""); setMDesc(""); setMSla("60"); setMPrio("2"); setMCor("#3B82F6");
    }
    setMotivoSheet(true);
  };

  const saveMotivo = async () => {
    if (!mNome || !userId) return;
    const payload = {
      nome: mNome, descricao: mDesc || null, sla_minutos: parseInt(mSla),
      prioridade: mPrio as any, cor_hex: mCor, user_id: userId,
    };
    if (editMotivo) {
      await supabase.from("motivos_atendimento").update(payload).eq("id", editMotivo.id);
    } else {
      await supabase.from("motivos_atendimento").insert(payload);
    }
    setMotivoSheet(false);
    fetchMotivos();
    toast({ title: editMotivo ? "Motivo atualizado" : "Motivo criado" });
  };

  const toggleMotivo = async (m: Motivo) => {
    await supabase.from("motivos_atendimento").update({ ativo: !m.ativo }).eq("id", m.id);
    fetchMotivos();
  };

  const deleteMotivo = async (id: string) => {
    await supabase.from("motivos_atendimento").delete().eq("id", id);
    fetchMotivos();
    toast({ title: "Motivo excluído" });
  };

  // Atendente form
  const [aNome, setANome] = useState("");
  const [aSetor, setASetor] = useState("");
  const [aSig, setASig] = useState("");
  const [aSigAtiva, setASigAtiva] = useState(true);
  const [aMax, setAMax] = useState("10");

  const openAtendenteSheet = (a?: Atendente) => {
    if (a) {
      setEditAtendente(a);
      setANome(a.nome_completo); setASetor(a.setor || ""); setASig(a.assinatura_padrao || "");
      setASigAtiva(a.assinatura_ativa); setAMax(String(a.max_tickets));
    } else {
      setEditAtendente(null);
      setANome(""); setASetor(""); setASig(""); setASigAtiva(true); setAMax("10");
    }
    setAtendenteSheet(true);
  };

  const saveAtendente = async () => {
    if (!aNome || !editAtendente) return;
    await supabase.from("atendentes_perfil").update({
      nome_completo: aNome, setor: aSetor || null, assinatura_padrao: aSig || null,
      assinatura_ativa: aSigAtiva, max_tickets: parseInt(aMax),
    }).eq("id", editAtendente.id);
    setAtendenteSheet(false);
    fetchAtendentes();
    toast({ title: "Atendente atualizado" });
  };

  // Minha assinatura
  const saveMeuPerfil = async () => {
    if (!meuPerfil) return;
    await supabase.from("atendentes_perfil").update({
      nome_completo: meuPerfil.nome_completo,
      setor: meuPerfil.setor,
      assinatura_padrao: meuPerfil.assinatura_padrao,
      assinatura_ativa: meuPerfil.assinatura_ativa,
    }).eq("id", meuPerfil.id);
    toast({ title: "Assinatura salva" });
  };

  // WhatsApp
  const saveWaConfig = async () => {
    if (!userId) return;
    await supabase.from("company_settings").update({
      atendimento_api_url: waUrl, atendimento_api_instance: waInstance, atendimento_api_token: waKey,
    } as any).eq("user_id", userId);
    toast({ title: "Configuração salva" });
  };

  const testWaConnection = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setWaConnected(false);
        toast({ title: "Erro", description: "Você precisa estar logado para testar a conexão.", variant: "destructive" });
        return;
      }
      const { data, error } = await supabase.functions.invoke("evolution-status", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) {
        setWaConnected(false);
      } else {
        setWaConnected(data?.connected === true);
      }
    } catch {
      setWaConnected(false);
    }
  };

  // Respostas rápidas CRUD
  const openRespostaSheet = (r?: RespostaRapida) => {
    if (r) { setEditResposta(r); setRNome(r.nome); setRConteudo(r.conteudo); setRCategoria(r.categoria); }
    else { setEditResposta(null); setRNome(""); setRConteudo(""); setRCategoria("Geral"); }
    setRespostaSheet(true);
  };

  const saveResposta = async () => {
    if (!rNome || !rConteudo || !userId) return;
    const payload = { nome: rNome, conteudo: rConteudo, categoria: rCategoria, user_id: userId };
    if (editResposta) {
      await (supabase.from("respostas_rapidas" as any).update(payload).eq("id", editResposta.id) as any);
    } else {
      await (supabase.from("respostas_rapidas" as any).insert(payload) as any);
    }
    setRespostaSheet(false);
    fetchRespostas();
    toast({ title: editResposta ? "Resposta atualizada" : "Resposta criada" });
  };

  const deleteResposta = async (id: string) => {
    await (supabase.from("respostas_rapidas" as any).delete().eq("id", id) as any);
    fetchRespostas();
    toast({ title: "Resposta excluída" });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-bold">Configurações de Atendimento</h1>

        <Tabs defaultValue="motivos">
          <TabsList className="w-full sm:w-auto flex-wrap">
            <TabsTrigger value="motivos">Motivos</TabsTrigger>
            <TabsTrigger value="respostas">Respostas Rápidas</TabsTrigger>
            <TabsTrigger value="atendentes">Atendentes</TabsTrigger>
            <TabsTrigger value="assinatura">Minha Assinatura</TabsTrigger>
            <TabsTrigger value="whatsapp">Instância WhatsApp</TabsTrigger>
          </TabsList>

          {/* Motivos */}
          <TabsContent value="motivos">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Motivos de Atendimento</CardTitle>
                <Button size="sm" onClick={() => openMotivoSheet()}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Novo Motivo
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Cor</TableHead>
                      <TableHead className="text-xs">Nome</TableHead>
                      <TableHead className="text-xs text-center">SLA (min)</TableHead>
                      <TableHead className="text-xs text-center">Prioridade</TableHead>
                      <TableHead className="text-xs text-center">Ativo</TableHead>
                      <TableHead className="text-xs text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {motivos.map(m => (
                      <TableRow key={m.id}>
                        <TableCell><span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: m.cor_hex }} /></TableCell>
                        <TableCell className="text-xs font-medium">{m.nome}</TableCell>
                        <TableCell className="text-xs text-center">{m.sla_minutos}</TableCell>
                        <TableCell className="text-xs text-center">{m.prioridade === "1" ? "Alta" : m.prioridade === "2" ? "Média" : "Baixa"}</TableCell>
                        <TableCell className="text-center">
                          <Switch checked={m.ativo} onCheckedChange={() => toggleMotivo(m)} className="scale-75" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openMotivoSheet(m)}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMotivo(m.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Respostas Rápidas */}
          <TabsContent value="respostas">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Respostas Rápidas</CardTitle>
                <Button size="sm" onClick={() => openRespostaSheet()}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Nova Resposta
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Nome</TableHead>
                      <TableHead className="text-xs">Categoria</TableHead>
                      <TableHead className="text-xs">Conteúdo</TableHead>
                      <TableHead className="text-xs text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {respostas.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs font-medium">{r.nome}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-[10px]">{r.categoria}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate">{r.conteudo}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openRespostaSheet(r)}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteResposta(r.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {respostas.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground text-xs py-6">
                          Nenhuma resposta rápida cadastrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Atendentes */}
          <TabsContent value="atendentes">
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Atendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Nome</TableHead>
                      <TableHead className="text-xs">Setor</TableHead>
                      <TableHead className="text-xs text-center">Max Tickets</TableHead>
                      <TableHead className="text-xs text-center">Disponível</TableHead>
                      <TableHead className="text-xs text-center">Assinatura</TableHead>
                      <TableHead className="text-xs text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {atendentes.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="text-xs font-medium">{a.nome_completo}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{a.setor || "-"}</TableCell>
                        <TableCell className="text-xs text-center">{a.max_tickets}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={a.disponivel ? "default" : "secondary"} className="text-[10px]">
                            {a.disponivel ? "Online" : "Ausente"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {a.assinatura_ativa ? <Check className="w-3 h-3 text-green-400 mx-auto" /> : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openAtendenteSheet(a)}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {atendentes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground text-xs py-6">
                          Nenhum atendente cadastrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Minha Assinatura */}
          <TabsContent value="assinatura">
            <Card className="glass-card max-w-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Minha Assinatura</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {meuPerfil ? (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs">Nome Completo</Label>
                      <Input value={meuPerfil.nome_completo} onChange={e => setMeuPerfil({ ...meuPerfil, nome_completo: e.target.value })} className="h-9 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Setor</Label>
                      <Input value={meuPerfil.setor || ""} onChange={e => setMeuPerfil({ ...meuPerfil, setor: e.target.value })} className="h-9 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Assinatura</Label>
                      <Textarea
                        value={meuPerfil.assinatura_padrao || ""}
                        onChange={e => { setMeuPerfil({ ...meuPerfil, assinatura_padrao: e.target.value }); setSigPreview(e.target.value); }}
                        className="text-sm min-h-[60px]"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={meuPerfil.assinatura_ativa} onCheckedChange={v => setMeuPerfil({ ...meuPerfil, assinatura_ativa: v })} />
                      <Label className="text-xs">Assinatura ativa</Label>
                    </div>

                    {/* Preview */}
                    <div className="mt-4">
                      <p className="text-[11px] text-muted-foreground mb-2">Preview:</p>
                      <div className="flex justify-end">
                        <div className="bg-primary text-primary-foreground rounded-xl rounded-tr-none px-3 py-2 text-sm max-w-[300px]">
                          <p>Olá! Segue a informação solicitada.</p>
                          {meuPerfil.assinatura_ativa && sigPreview && (
                            <p className="text-[10px] mt-1 text-primary-foreground/50">— {sigPreview}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button size="sm" onClick={saveMeuPerfil}>Salvar</Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Perfil de atendente não encontrado. Peça ao administrador para cadastrá-lo.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* WhatsApp */}
          <TabsContent value="whatsapp">
            <Card className="glass-card max-w-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Instância WhatsApp (Evolution API)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Webhook URL */}
                <div className="space-y-2">
                  <Label className="text-xs">URL do Webhook (configure na Evolution API)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evolution-webhook`}
                      className="h-9 text-xs bg-muted/50 font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evolution-webhook`);
                        toast({ title: "URL copiada!" });
                      }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Cole esta URL no campo "Webhook URL" da sua instância na Evolution API. Eventos suportados: <code>messages.upsert</code>, <code>messages.update</code></p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">URL da API</Label>
                  <Input value={waUrl} onChange={e => setWaUrl(e.target.value)} placeholder="https://..." className="h-9 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Instância</Label>
                  <Input value={waInstance} onChange={e => setWaInstance(e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">API Key</Label>
                  <Input value={waKey} onChange={e => setWaKey(e.target.value)} type="password" className="h-9 text-sm" />
                </div>

                {waConnected !== null && (
                  <div className="flex items-center gap-2">
                    {waConnected ? (
                      <><Wifi className="w-4 h-4 text-green-400" /><span className="text-sm text-green-400">Conectado</span></>
                    ) : (
                      <><WifiOff className="w-4 h-4 text-destructive" /><span className="text-sm text-destructive">Desconectado</span></>
                    )}
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" onClick={saveWaConfig}>Salvar</Button>
                  <Button size="sm" variant="outline" onClick={testWaConnection}>Testar Conexão</Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      setSyncing(true);
                      setSyncResult(null);
                      try {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (!session?.access_token) throw new Error("Não autenticado");
                        const { data, error } = await supabase.functions.invoke("sync-whatsapp-history", {
                          headers: { Authorization: `Bearer ${session.access_token}` },
                        });
                        if (error) throw error;
                        setSyncResult({ imported: data.imported, skipped: data.skipped, total: data.total });
                        toast({ title: `Histórico importado`, description: `${data.imported} conversas importadas, ${data.skipped} já existentes` });
                      } catch (err: any) {
                        toast({ title: "Erro ao sincronizar", description: err.message, variant: "destructive" });
                      }
                      setSyncing(false);
                    }}
                    disabled={syncing || !waInstance}
                  >
                    {syncing ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-1" />}
                    {syncing ? "Importando..." : "Importar Histórico"}
                  </Button>
                </div>
                {syncResult && (
                  <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-2">
                    ✅ {syncResult.imported} conversas importadas · {syncResult.skipped} já existentes · {syncResult.total} total encontradas
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Motivo Sheet */}
        <Sheet open={motivoSheet} onOpenChange={setMotivoSheet}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{editMotivo ? "Editar Motivo" : "Novo Motivo"}</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-xs">Nome</Label>
                <Input value={mNome} onChange={e => setMNome(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Descrição</Label>
                <Textarea value={mDesc} onChange={e => setMDesc(e.target.value)} className="text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">SLA (minutos)</Label>
                  <Input type="number" value={mSla} onChange={e => setMSla(e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Prioridade</Label>
                  <Select value={mPrio} onValueChange={setMPrio}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Alta</SelectItem>
                      <SelectItem value="2">Média</SelectItem>
                      <SelectItem value="3">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Cor</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={mCor} onChange={e => setMCor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                  <Input value={mCor} onChange={e => setMCor(e.target.value)} className="h-9 text-sm flex-1" />
                </div>
              </div>
              <Button onClick={saveMotivo} className="w-full">Salvar</Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Atendente Sheet */}
        <Sheet open={atendenteSheet} onOpenChange={setAtendenteSheet}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Editar Atendente</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-xs">Nome Completo</Label>
                <Input value={aNome} onChange={e => setANome(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Setor</Label>
                <Input value={aSetor} onChange={e => setASetor(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Assinatura</Label>
                <Textarea value={aSig} onChange={e => setASig(e.target.value)} className="text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={aSigAtiva} onCheckedChange={setASigAtiva} />
                <Label className="text-xs">Assinatura ativa</Label>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Max Tickets</Label>
                <Input type="number" value={aMax} onChange={e => setAMax(e.target.value)} className="h-9 text-sm" />
              </div>
              <Button onClick={saveAtendente} className="w-full">Salvar</Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Resposta Rápida Sheet */}
        <Sheet open={respostaSheet} onOpenChange={setRespostaSheet}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{editResposta ? "Editar Resposta" : "Nova Resposta Rápida"}</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-xs">Nome (atalho)</Label>
                <Input value={rNome} onChange={e => setRNome(e.target.value)} placeholder="Ex: Saudação" className="h-9 text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Categoria</Label>
                <Input value={rCategoria} onChange={e => setRCategoria(e.target.value)} placeholder="Ex: Geral, Suporte, Vendas" className="h-9 text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Conteúdo da mensagem</Label>
                <Textarea value={rConteudo} onChange={e => setRConteudo(e.target.value)} placeholder="Olá! Como posso ajudar?" className="text-sm min-h-[100px]" />
              </div>
              <Button onClick={saveResposta} className="w-full">Salvar</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
}
