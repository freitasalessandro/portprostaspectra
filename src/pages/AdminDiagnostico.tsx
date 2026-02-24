import AdminLayout from "@/components/AdminLayout";
import { getNavigationTelemetry } from "@/hooks/useNavigationTelemetry";
import { useState } from "react";
import { RefreshCw, Trash2, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const AdminDiagnostico = () => {
  const [data, setData] = useState(getNavigationTelemetry);
  const [errorLogs, setErrorLogs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("error_logs") || "[]"); } catch { return []; }
  });

  const refresh = () => {
    setData(getNavigationTelemetry());
    try { setErrorLogs(JSON.parse(localStorage.getItem("error_logs") || "[]")); } catch {}
  };

  const clearTelemetry = () => {
    localStorage.removeItem("nav_telemetry");
    localStorage.removeItem("error_logs");
    setData([]);
    setErrorLogs([]);
  };

  const statusColor = (status: string) => {
    if (status === "timeout") return "text-destructive font-bold";
    if (status === "slow") return "text-orange-400 font-semibold";
    return "text-green-400";
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-5xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold tracking-tight text-foreground">Diagnóstico</h1>
              <p className="text-xs text-muted-foreground">Telemetria de navegação e erros capturados</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Atualizar
            </Button>
            <Button variant="destructive" size="sm" onClick={clearTelemetry}>
              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Limpar
            </Button>
          </div>
        </div>

        {/* Navigation Telemetry */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
            Navegação ({data.length} eventos)
          </h2>
          <div className="rounded-lg border border-border/40 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs">Rota</TableHead>
                  <TableHead className="text-xs w-28">Tempo (ms)</TableHead>
                  <TableHead className="text-xs w-24">Status</TableHead>
                  <TableHead className="text-xs w-44">Horário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground text-sm py-8">
                      Nenhum dado de navegação registrado ainda.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((ev: any, i: number) => (
                    <TableRow key={i} className={ev.status !== "ok" ? "bg-destructive/5" : ""}>
                      <TableCell className="font-mono text-xs">{ev.route}</TableCell>
                      <TableCell className={`font-mono text-xs ${ev.loadTimeMs > 3000 ? "text-destructive font-bold" : ""}`}>
                        {ev.loadTimeMs}
                      </TableCell>
                      <TableCell className={`text-xs uppercase ${statusColor(ev.status)}`}>
                        {ev.status}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(ev.timestamp).toLocaleString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Error Logs */}
        {errorLogs.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-destructive uppercase tracking-wider">
              Erros Capturados ({errorLogs.length})
            </h2>
            <div className="space-y-2">
              {errorLogs.map((log: any, i: number) => (
                <div key={i} className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-destructive">{log.route}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(log.timestamp).toLocaleString("pt-BR")}</span>
                  </div>
                  <p className="text-xs text-foreground/80 font-mono">{log.error}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDiagnostico;
