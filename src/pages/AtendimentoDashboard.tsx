import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Inbox, Clock, Zap, Shield, Star, AlertTriangle } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, subDays } from "date-fns";

interface KpiDay {
  dia: string;
  total: number;
  encerrados: number;
  sla_ok: number;
  sla_violado: number;
  tmr_minutos: number | null;
  tma_minutos: number | null;
  nps_medio: number | null;
}

interface KpiAtendente {
  atendente_id: string;
  nome_completo: string;
  setor: string | null;
  total: number;
  encerrados: number;
  tmr_medio: number | null;
  tma_medio: number | null;
  violacoes_sla: number;
  avaliacao_media: number | null;
}

const periods = [
  { label: "Hoje", days: 0 },
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
];

export default function AtendimentoDashboard() {
  const [period, setPeriod] = useState(7);
  const [kpiData, setKpiData] = useState<KpiDay[]>([]);
  const [atendenteData, setAtendenteData] = useState<KpiAtendente[]>([]);
  const [motivoData, setMotivoData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const since = period === 0 ? format(new Date(), "yyyy-MM-dd") : format(subDays(new Date(), period), "yyyy-MM-dd");

      const [{ data: kpi }, { data: atd }, { data: motivos }] = await Promise.all([
        supabase.from("kpi_dashboard").select("*").gte("dia", since).order("dia"),
        supabase.from("kpi_por_atendente").select("*"),
        supabase.from("tickets").select("motivo_id, motivos_atendimento(nome, cor_hex)").gte("created_at", since),
      ]);

      setKpiData((kpi || []) as KpiDay[]);
      setAtendenteData((atd || []) as KpiAtendente[]);

      // Group tickets by motivo
      const motivoMap: Record<string, { nome: string; cor: string; count: number }> = {};
      (motivos || []).forEach((t: any) => {
        if (t.motivo_id && t.motivos_atendimento) {
          const key = t.motivo_id;
          if (!motivoMap[key]) motivoMap[key] = { nome: t.motivos_atendimento.nome, cor: t.motivos_atendimento.cor_hex, count: 0 };
          motivoMap[key].count++;
        }
      });
      setMotivoData(Object.values(motivoMap).sort((a, b) => b.count - a.count));
      setLoading(false);
    };
    fetch();
  }, [period]);

  const totals = kpiData.reduce((acc, d) => ({
    total: acc.total + d.total,
    encerrados: acc.encerrados + d.encerrados,
    sla_ok: acc.sla_ok + d.sla_ok,
    sla_violado: acc.sla_violado + d.sla_violado,
    tmr_sum: acc.tmr_sum + (d.tmr_minutos || 0),
    tma_sum: acc.tma_sum + (d.tma_minutos || 0),
    nps_sum: acc.nps_sum + (d.nps_medio || 0),
    nps_count: acc.nps_count + (d.nps_medio ? 1 : 0),
    days: acc.days + 1,
  }), { total: 0, encerrados: 0, sla_ok: 0, sla_violado: 0, tmr_sum: 0, tma_sum: 0, nps_sum: 0, nps_count: 0, days: 0 });

  const slaPct = totals.encerrados > 0 ? Math.round((totals.sla_ok / totals.encerrados) * 100) : 0;
  const tmrAvg = totals.days > 0 ? Math.round(totals.tmr_sum / totals.days) : 0;
  const tmaAvg = totals.days > 0 ? Math.round(totals.tma_sum / totals.days) : 0;
  const npsAvg = totals.nps_count > 0 ? (totals.nps_sum / totals.nps_count).toFixed(1) : "-";

  const kpis = [
    { label: "Total de Tickets", value: totals.total, icon: Inbox, color: "text-blue-400" },
    { label: "TMA", value: `${tmaAvg}min`, icon: Clock, color: "text-green-400" },
    { label: "TMR", value: `${tmrAvg}min`, icon: Zap, color: "text-amber-400" },
    { label: "SLA Cumprido", value: `${slaPct}%`, icon: Shield, color: slaPct >= 90 ? "text-green-400" : "text-destructive" },
    { label: "NPS Médio", value: npsAvg, icon: Star, color: "text-purple-400" },
    { label: "Violações SLA", value: totals.sla_violado, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">Dashboard de Atendimento</h1>
          <div className="flex gap-1">
            {periods.map(p => (
              <Button
                key={p.days}
                variant={period === p.days ? "default" : "ghost"}
                size="sm"
                onClick={() => setPeriod(p.days)}
                className="text-xs"
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {kpis.map(kpi => (
            <Card key={kpi.label} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                  <span className="text-[11px] text-muted-foreground">{kpi.label}</span>
                </div>
                <p className="text-2xl font-bold font-display">{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Volume de Tickets por Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={kpiData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="dia" tick={{ fontSize: 11 }} tickFormatter={v => format(new Date(v), "dd/MM")} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="encerrados" stroke="hsl(142 76% 36%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tickets por Motivo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={motivoData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="nome" type="category" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {motivoData.map((entry, i) => (
                      <Cell key={i} fill={entry.cor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Atendentes table */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Desempenho por Atendente</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Atendente</TableHead>
                  <TableHead className="text-xs">Setor</TableHead>
                  <TableHead className="text-xs text-center">Total</TableHead>
                  <TableHead className="text-xs text-center">Encerrados</TableHead>
                  <TableHead className="text-xs text-center">TMA</TableHead>
                  <TableHead className="text-xs text-center">TMR</TableHead>
                  <TableHead className="text-xs text-center">Violações</TableHead>
                  <TableHead className="text-xs text-center">Avaliação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atendenteData.map(a => (
                  <TableRow key={a.atendente_id}>
                    <TableCell className="text-xs font-medium">{a.nome_completo}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.setor || "-"}</TableCell>
                    <TableCell className="text-xs text-center">{a.total}</TableCell>
                    <TableCell className="text-xs text-center">{a.encerrados}</TableCell>
                    <TableCell className="text-xs text-center">{a.tma_medio ? `${a.tma_medio}min` : "-"}</TableCell>
                    <TableCell className="text-xs text-center">{a.tmr_medio ? `${a.tmr_medio}min` : "-"}</TableCell>
                    <TableCell className="text-xs text-center">{a.violacoes_sla}</TableCell>
                    <TableCell className="text-xs text-center">{a.avaliacao_media || "-"}</TableCell>
                  </TableRow>
                ))}
                {atendenteData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground text-xs py-6">
                      Nenhum dado disponível
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
