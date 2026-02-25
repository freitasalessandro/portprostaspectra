import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, AlertTriangle, RefreshCw, Bug } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const ERROR_TYPES = [
  { value: "all", label: "Todos os tipos" },
  { value: "unhandled_rejection", label: "Unhandled Rejection" },
  { value: "permission_denied", label: "Permission Denied" },
  { value: "async_error", label: "Async Error" },
  { value: "render_error", label: "Render Error" },
  { value: "network_error", label: "Network Error" },
];

const typeBadgeVariant: Record<string, string> = {
  unhandled_rejection: "bg-destructive/15 text-destructive border-destructive/20",
  permission_denied: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
  async_error: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20",
  render_error: "bg-red-500/15 text-red-500 border-red-500/20",
  network_error: "bg-blue-500/15 text-blue-500 border-blue-500/20",
};

export default function AdminErrorLogs() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [routeFilter, setRouteFilter] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const { data: logs, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["frontend-error-logs", typeFilter, routeFilter, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from("frontend_error_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (typeFilter !== "all") query = query.eq("error_type", typeFilter);
      if (routeFilter.trim()) query = query.ilike("route", `%${routeFilter.trim()}%`);
      if (dateFrom) query = query.gte("created_at", dateFrom.toISOString());
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        query = query.lte("created_at", end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const clearFilters = () => {
    setTypeFilter("all");
    setRouteFilter("");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bug className="w-6 h-6 text-destructive" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Logs de Erro</h1>
              <p className="text-sm text-muted-foreground">Erros capturados no frontend em tempo real</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("w-4 h-4 mr-2", isFetching && "animate-spin")} />
            Atualizar
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="w-48">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ERROR_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-48">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Rota</label>
            <Input placeholder="/admin/..." value={routeFilter} onChange={e => setRouteFilter(e.target.value)} />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">De</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-36 justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {dateFrom ? format(dateFrom, "dd/MM/yy") : "Início"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} locale={ptBR} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Até</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-36 justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {dateTo ? format(dateTo, "dd/MM/yy") : "Fim"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} locale={ptBR} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          <Button variant="ghost" size="sm" onClick={clearFilters}>Limpar</Button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : !logs?.length ? (
          <div className="text-center py-16 text-muted-foreground">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nenhum erro encontrado com os filtros atuais.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[160px]">Data</TableHead>
                  <TableHead className="w-[150px]">Tipo</TableHead>
                  <TableHead className="w-[120px]">Rota</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead className="w-[120px]">Contexto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id} className="text-xs">
                    <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.created_at), "dd/MM HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px] font-medium", typeBadgeVariant[log.error_type] || "")}>
                        {log.error_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground truncate max-w-[120px]" title={log.route ?? ""}>
                      {log.route || "—"}
                    </TableCell>
                    <TableCell className="truncate max-w-[400px]" title={log.error_message ?? ""}>
                      {log.error_message || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-[120px]" title={log.context ?? ""}>
                      {log.context || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-right">
          {logs?.length ?? 0} registros (máx. 200)
        </p>
      </div>
    </AdminLayout>
  );
}
