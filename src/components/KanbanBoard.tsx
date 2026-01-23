import { useState } from "react";
import { DemandWithProfile } from "@/types/demand";
import DemandCard from "./DemandCard";
import DemandDetailDialog from "./DemandDetailDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLastComments } from "@/hooks/useComments";
import { Clock, PlayCircle, CheckCircle2 } from "lucide-react";

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
  icon: React.ElementType;
  emptyMessage: string;
  bgColor: string;
  isEmpty: boolean;
}

const KanbanColumn = ({
  title,
  count,
  children,
  icon: Icon,
  emptyMessage,
  bgColor,
  isEmpty,
}: KanbanColumnProps) => (
  <div
    className={`${bgColor} rounded-2xl overflow-hidden flex flex-col ${isEmpty ? "" : "max-h-[calc(100vh-180px)]"}`}
  >
    {/* Header */}
    <div className="flex items-center gap-2 px-4 py-4 shrink-0">
      <Icon size={16} className="text-gray-400" strokeWidth={1.5} />
      <h2 className="font-medium text-gray-700 text-sm">{title}</h2>
      <span className="text-xs font-medium text-gray-400 bg-white/60 px-2 py-0.5 rounded-full">
        {count}
      </span>
    </div>

    {/* Content */}
    {isEmpty ? (
      <div className="px-4 pb-4 text-center text-gray-400 text-sm">
        {emptyMessage}
      </div>
    ) : (
      <ScrollArea className="flex-1 min-h-0">
        <div className="pb-4">{children}</div>
      </ScrollArea>
    )}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {/* Coluna: Demandas Recebidas / Em Fila */}
        <KanbanColumn
          title="Demandas Recebidas"
          count={openDemands.length}
          icon={Clock}
          bgColor="bg-white/60"
          emptyMessage="Nenhuma demanda na fila"
          isEmpty={openDemands.length === 0}
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
          icon={PlayCircle}
          bgColor="bg-amber-50/60"
          emptyMessage="Nenhuma demanda em andamento"
          isEmpty={inProgressDemands.length === 0}
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
          title="Finalizadas Hoje"
          count={completedDemands.length}
          icon={CheckCircle2}
          bgColor="bg-green-50/60"
          emptyMessage="Nenhuma demanda concluída hoje"
          isEmpty={completedDemands.length === 0}
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
