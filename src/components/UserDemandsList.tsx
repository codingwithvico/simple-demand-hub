import { useState } from "react";
import { DemandWithProfile } from "@/types/demand";
import DemandDetailDialog from "./DemandDetailDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useLastComments } from "@/hooks/useComments";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
} from "lucide-react";

interface UserDemandsListProps {
  demands: DemandWithProfile[];
}

const statusConfig = {
  open: {
    label: "Aguardando",
    variant: "outline" as const,
    icon: Circle,
    color: "text-muted-foreground",
  },
  in_progress: {
    label: "Em andamento",
    variant: "secondary" as const,
    icon: Loader2,
    color: "text-blue-500",
  },
  completed: {
    label: "Concluída",
    variant: "default" as const,
    icon: CheckCircle2,
    color: "text-green-500",
  },
};

const UserDemandsList = ({ demands }: UserDemandsListProps) => {
  const [selectedDemand, setSelectedDemand] =
    useState<DemandWithProfile | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Buscar último comentário de todas as demandas
  const allDemandIds = demands.map((d) => d.id);
  const { data: lastComments = {} } = useLastComments(allDemandIds);

  const handleCardClick = (demand: DemandWithProfile) => {
    setSelectedDemand(demand);
    setDialogOpen(true);
  };

  // Separa demandas por status
  const pendingDemands = demands.filter((d) => d.status !== "completed");
  const completedDemands = demands.filter((d) => d.status === "completed");

  if (demands.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-muted-foreground mb-4">
          <MessageSquare size={48} strokeWidth={1} />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          Nenhuma demanda criada hoje
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Use o formulário acima para criar uma nova demanda. Ela aparecerá aqui
          e você poderá acompanhar o andamento.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 h-[calc(100vh-220px)] overflow-hidden">
        <ScrollArea className="h-full pr-4">
          {/* Demandas pendentes */}
          {pendingDemands.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Clock size={16} className="text-muted-foreground" />
                Minhas Demandas em Aberto
                <Badge variant="secondary" className="text-xs">
                  {pendingDemands.length}
                </Badge>
              </h2>
              <div className="space-y-3">
                {pendingDemands.map((demand) => {
                  const config = statusConfig[demand.status];
                  const StatusIcon = config.icon;
                  const lastComment = lastComments[demand.id];

                  return (
                    <Card
                      key={demand.id}
                      className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => handleCardClick(demand)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Header com tipo e status */}
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {demand.demand_type_name && (
                              <Badge variant="outline" className="text-xs">
                                {demand.demand_type_name}
                              </Badge>
                            )}
                            <Badge
                              variant={config.variant}
                              className="text-xs flex items-center gap-1"
                            >
                              <StatusIcon
                                size={12}
                                className={
                                  demand.status === "in_progress"
                                    ? "animate-spin"
                                    : ""
                                }
                              />
                              {config.label}
                            </Badge>
                          </div>

                          {/* Título */}
                          {demand.title && (
                            <h3 className="text-foreground font-medium text-sm mb-1">
                              {demand.title}
                            </h3>
                          )}

                          {/* Descrição */}
                          <p className="text-foreground/80 text-sm line-clamp-2">
                            {demand.description}
                          </p>

                          {/* Responsável (se assumida) */}
                          {demand.claimed_by_name &&
                            demand.status !== "open" && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Responsável:{" "}
                                <span className="font-medium">
                                  {demand.claimed_by_name}
                                </span>
                              </p>
                            )}

                          {/* Último comentário */}
                          {lastComment && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                <MessageSquare
                                  size={12}
                                  className="mt-0.5 shrink-0"
                                />
                                <div className="min-w-0">
                                  <span className="font-medium text-foreground/80">
                                    {lastComment.user_name}:
                                  </span>{" "}
                                  <span className="line-clamp-1">
                                    {lastComment.content}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Tempo */}
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(demand.created_at, {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Demandas concluídas */}
          {completedDemands.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-500" />
                Concluídas Hoje
                <Badge variant="default" className="text-xs">
                  {completedDemands.length}
                </Badge>
              </h2>
              <div className="space-y-3">
                {completedDemands.map((demand) => {
                  const lastComment = lastComments[demand.id];

                  return (
                    <Card
                      key={demand.id}
                      className="p-4 cursor-pointer hover:border-primary/50 transition-colors opacity-70"
                      onClick={() => handleCardClick(demand)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {demand.demand_type_name && (
                              <Badge variant="outline" className="text-xs">
                                {demand.demand_type_name}
                              </Badge>
                            )}
                            <Badge
                              variant="default"
                              className="text-xs flex items-center gap-1"
                            >
                              <CheckCircle2 size={12} />
                              Concluída
                            </Badge>
                          </div>

                          {demand.title && (
                            <h3 className="text-foreground font-medium text-sm mb-1">
                              {demand.title}
                            </h3>
                          )}

                          <p className="text-foreground/80 text-sm line-clamp-2">
                            {demand.description}
                          </p>

                          {demand.completed_by_name && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Concluída por:{" "}
                              <span className="font-medium">
                                {demand.completed_by_name}
                              </span>
                            </p>
                          )}

                          {lastComment && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                <MessageSquare
                                  size={12}
                                  className="mt-0.5 shrink-0"
                                />
                                <div className="min-w-0">
                                  <span className="font-medium text-foreground/80">
                                    {lastComment.user_name}:
                                  </span>{" "}
                                  <span className="line-clamp-1">
                                    {lastComment.content}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(demand.created_at, {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </ScrollArea>
      </div>

      <DemandDetailDialog
        demand={selectedDemand}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
};

export default UserDemandsList;
