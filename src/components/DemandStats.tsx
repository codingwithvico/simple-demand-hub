import { useState, useEffect } from "react";
import { useDemandStats } from "@/hooks/useDemandStats";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, BarChart3, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function DemandStats() {
  const { stats, loading, fetchStats } = useDemandStats();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleFilter = () => {
    fetchStats(startDate, endDate);
  };

  const handleClear = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    fetchStats();
  };

  const handleToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    setStartDate(today);
    setEndDate(tomorrow);
    fetchStats(today, tomorrow);
  };

  return (
    <div className="border border-border rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-medium">Relatório</h2>
      </div>

      {/* Filtros de data */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn("justify-start text-left font-normal", !startDate && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Data início"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={startDate} onSelect={setStartDate} locale={ptBR} />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn("justify-start text-left font-normal", !endDate && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Data fim"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={endDate} onSelect={setEndDate} locale={ptBR} />
          </PopoverContent>
        </Popover>

        <Button variant="outline" size="sm" onClick={handleToday}>
          Hoje
        </Button>
        <Button variant="default" size="sm" onClick={handleFilter} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Filtrar
        </Button>
        {(startDate || endDate) && (
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Limpar
          </Button>
        )}
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-semibold">{stats.open_count}</div>
            <div className="text-xs text-muted-foreground">Abertas</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-semibold">{stats.in_progress_count}</div>
            <div className="text-xs text-muted-foreground">Em andamento</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-semibold">{stats.completed_count}</div>
            <div className="text-xs text-muted-foreground">Concluídas</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-semibold">{stats.total_count}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
        </div>
      )}
    </div>
  );
}
