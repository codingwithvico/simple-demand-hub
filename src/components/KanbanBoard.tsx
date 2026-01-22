import { DemandWithProfile } from "@/types/demand";
import DemandCard from "./DemandCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface KanbanBoardProps {
  pendingDemands: DemandWithProfile[];
  completedDemands: DemandWithProfile[];
  onDelete: (id: string) => void;
  onClaim?: (id: string) => void;
  onComplete?: (id: string) => void;
  onUnclaim?: (id: string) => void;
  claimingId?: string | null;
  completingId?: string | null;
  unclaimingId?: string | null;
  isMaster?: boolean;
}

const KanbanColumn = ({
  title,
  count,
  children,
  variant = "default",
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  variant?: "default" | "completed";
}) => (
  <div className="flex flex-col h-full min-w-0">
    <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card/50">
      <h2 className="font-semibold text-foreground text-sm">{title}</h2>
      <Badge
        variant={variant === "completed" ? "default" : "secondary"}
        className="text-xs"
      >
        {count}
      </Badge>
    </div>
    <ScrollArea className="flex-1">
      <div className="py-3">{children}</div>
    </ScrollArea>
  </div>
);

const KanbanBoard = ({
  pendingDemands,
  completedDemands,
  onDelete,
  onClaim,
  onComplete,
  onUnclaim,
  claimingId,
  completingId,
  unclaimingId,
  isMaster,
}: KanbanBoardProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
      {/* Coluna: Demandas Recebidas / Em Fila */}
      <div className="bg-card rounded-lg border border-border overflow-hidden flex flex-col h-[calc(100vh-180px)]">
        <KanbanColumn title="Demandas Recebidas" count={pendingDemands.length}>
          {pendingDemands.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground text-sm">
              Nenhuma demanda na fila
            </div>
          ) : (
            pendingDemands.map((demand, index) => (
              <DemandCard
                key={demand.id}
                demand={demand}
                queuePosition={index + 1}
                onDelete={onDelete}
                onClaim={onClaim}
                onComplete={onComplete}
                onUnclaim={onUnclaim}
                isClaiming={claimingId === demand.id}
                isCompleting={completingId === demand.id}
                isUnclaiming={unclaimingId === demand.id}
                isMaster={isMaster}
              />
            ))
          )}
        </KanbanColumn>
      </div>

      {/* Coluna: Demandas Finalizadas (Hoje) */}
      <div className="bg-card rounded-lg border border-border overflow-hidden flex flex-col h-[calc(100vh-180px)]">
        <KanbanColumn
          title="Finalizadas Hoje"
          count={completedDemands.length}
          variant="completed"
        >
          {completedDemands.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground text-sm">
              Nenhuma demanda concluída hoje
            </div>
          ) : (
            completedDemands.map((demand) => (
              <DemandCard
                key={demand.id}
                demand={demand}
                onDelete={onDelete}
                isMaster={isMaster}
              />
            ))
          )}
        </KanbanColumn>
      </div>
    </div>
  );
};

export default KanbanBoard;
