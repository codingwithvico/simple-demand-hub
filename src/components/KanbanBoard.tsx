import { useState } from "react";
import { DemandWithProfile } from "@/types/demand";
import DemandCard from "./DemandCard";
import DemandDetailDialog from "./DemandDetailDialog";
import { useLastComments } from "@/hooks/useComments";

interface KanbanBoardProps {
  openDemands: DemandWithProfile[];
  inProgressDemands: DemandWithProfile[];
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

interface KanbanColumnProps {
  title: string;
  count: number;
  children: React.ReactNode;
  status: "open" | "in-progress" | "completed";
  emptyMessage: string;
}

const statusDotColors = {
  open: "bg-blue-500",
  "in-progress": "bg-amber-500",
  completed: "bg-green-500",
};

const KanbanColumn = ({
  title,
  count,
  children,
  status,
  emptyMessage,
}: KanbanColumnProps) => (
  <div
    className="flex flex-1 min-w-[280px] flex-col rounded-2xl max-h-[calc(100vh-220px)] overflow-hidden"
    style={{ background: "hsl(var(--kanban-column-bg))" }}
  >
    {/* Header */}
    <div
      className="flex items-center gap-2.5 p-4 font-semibold text-[13px] uppercase tracking-wide"
      style={{
        color: "hsl(var(--kanban-text-secondary))",
        borderBottom: "1px solid hsl(var(--kanban-card-border))",
      }}
    >
      <span className={`w-2 h-2 rounded-full ${statusDotColors[status]}`} />
      <span>{title}</span>
      <span
        className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-xs font-medium rounded-md"
        style={{
          background: "hsl(var(--kanban-card-border))",
          color: "hsl(var(--kanban-text-secondary))",
        }}
      >
        {count}
      </span>
    </div>

    {/* Card List */}
    <div className="flex flex-col gap-2.5 p-3 overflow-y-auto flex-1 kanban-scrollbar">
      {count === 0 ? (
        <div
          className="text-center py-8 text-sm"
          style={{ color: "hsl(var(--kanban-text-secondary))" }}
        >
          {emptyMessage}
        </div>
      ) : (
        children
      )}
    </div>
  </div>
);

const KanbanBoard = ({
  openDemands,
  inProgressDemands,
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
  const [selectedDemand, setSelectedDemand] =
    useState<DemandWithProfile | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Buscar último comentário de todas as demandas
  const allDemandIds = [
    ...openDemands,
    ...inProgressDemands,
    ...completedDemands,
  ].map((d) => d.id);
  const { data: lastComments = {} } = useLastComments(allDemandIds);

  const handleCardClick = (demand: DemandWithProfile) => {
    setSelectedDemand(demand);
    setDialogOpen(true);
  };

  return (
    <>
      <div
        className="flex gap-5 p-5 min-h-[calc(100vh-180px)] overflow-x-auto rounded-2xl"
        style={{ background: "hsl(var(--kanban-board-bg))" }}
      >
        {/* Coluna: Demandas Recebidas / Em Fila */}
        <KanbanColumn
          title={isMaster ? "Recebidas" : "Enviadas"}
          count={openDemands.length}
          status="open"
          emptyMessage="Nenhuma demanda na fila"
        >
          {openDemands.map((demand, index) => (
            <DemandCard
              key={demand.id}
              demand={demand}
              queuePosition={index + 1}
              lastComment={lastComments[demand.id]}
              onDelete={onDelete}
              onClaim={onClaim}
              onComplete={onComplete}
              onUnclaim={onUnclaim}
              onClick={() => handleCardClick(demand)}
              isClaiming={claimingId === demand.id}
              isCompleting={completingId === demand.id}
              isUnclaiming={unclaimingId === demand.id}
              isMaster={isMaster}
            />
          ))}
        </KanbanColumn>

        {/* Coluna: Em Andamento (Assumidas) */}
        <KanbanColumn
          title="Em Andamento"
          count={inProgressDemands.length}
          status="in-progress"
          emptyMessage="Nenhuma demanda em andamento"
        >
          {inProgressDemands.map((demand) => (
            <DemandCard
              key={demand.id}
              demand={demand}
              lastComment={lastComments[demand.id]}
              onDelete={onDelete}
              onClaim={onClaim}
              onComplete={onComplete}
              onUnclaim={onUnclaim}
              onClick={() => handleCardClick(demand)}
              isClaiming={claimingId === demand.id}
              isCompleting={completingId === demand.id}
              isUnclaiming={unclaimingId === demand.id}
              isMaster={isMaster}
            />
          ))}
        </KanbanColumn>

        {/* Coluna: Demandas Finalizadas (Hoje) */}
        <KanbanColumn
          title="Finalizadas"
          count={completedDemands.length}
          status="completed"
          emptyMessage="Nenhuma demanda concluída hoje"
        >
          {completedDemands.map((demand) => (
            <DemandCard
              key={demand.id}
              demand={demand}
              lastComment={lastComments[demand.id]}
              onDelete={onDelete}
              onClick={() => handleCardClick(demand)}
              isMaster={isMaster}
            />
          ))}
        </KanbanColumn>
      </div>

      <DemandDetailDialog
        demand={selectedDemand}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
};

export default KanbanBoard;
