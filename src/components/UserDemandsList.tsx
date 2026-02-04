import { useState } from "react";
import { DemandWithProfile } from "@/types/demand";
import DemandDetailDialog from "./DemandDetailDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLastComments } from "@/hooks/useComments";
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface UserDemandsListProps {
  demands: DemandWithProfile[];
}

const statusConfig = {
  open: {
    label: "Aguardando",
    icon: Circle,
    bgColor: "bg-muted",
    textColor: "text-muted-foreground",
  },
  in_progress: {
    label: "Em andamento",
    icon: Loader2,
    bgColor: "bg-amber-500/20 dark:bg-amber-500/30",
    textColor: "text-amber-700 dark:text-amber-400",
  },
  completed: {
    label: "Concluída",
    icon: CheckCircle2,
    bgColor: "bg-green-500/20 dark:bg-green-500/30",
    textColor: "text-green-700 dark:text-green-400",
  },
};

// Gera iniciais do nome para o avatar
const getInitials = (name: string | null) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

// Gera cor de fundo baseada no nome
const getAvatarColor = (name: string | null) => {
  if (!name) return "bg-muted text-muted-foreground";
  const colors = [
    "bg-blue-500/20 text-blue-700 dark:bg-blue-500/30 dark:text-blue-300",
    "bg-green-500/20 text-green-700 dark:bg-green-500/30 dark:text-green-300",
    "bg-purple-500/20 text-purple-700 dark:bg-purple-500/30 dark:text-purple-300",
    "bg-orange-500/20 text-orange-700 dark:bg-orange-500/30 dark:text-orange-300",
    "bg-pink-500/20 text-pink-700 dark:bg-pink-500/30 dark:text-pink-300",
    "bg-cyan-500/20 text-cyan-700 dark:bg-cyan-500/30 dark:text-cyan-300",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

// Formata tempo de forma curta
const formatShortTime = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
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
        <div className="text-muted-foreground/50 mb-4">
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
              <h2 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Clock size={16} className="text-muted-foreground" />
                Minhas Demandas em Aberto
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {pendingDemands.length}
                </span>
              </h2>
              <div className="space-y-2">
                {pendingDemands.map((demand) => {
                  const config = statusConfig[demand.status];
                  const StatusIcon = config.icon;
                  const lastComment = lastComments[demand.id];
                  const displayName = demand.created_by_name || "Você";

                  return (
                    <div
                      key={demand.id}
                      className="bg-card rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-border"
                      onClick={() => handleCardClick(demand)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          className={`h-9 w-9 ${getAvatarColor(displayName)}`}
                        >
                          <AvatarFallback
                            className={`text-xs font-medium ${getAvatarColor(displayName)}`}
                          >
                            {getInitials(displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground truncate">
                              {demand.demand_type_name || "Demanda"}
                            </p>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.textColor} flex items-center gap-1`}
                            >
                              <StatusIcon
                                size={10}
                                className={
                                  demand.status === "in_progress"
                                    ? "animate-spin"
                                    : ""
                                }
                              />
                              {config.label}
                            </span>
                          </div>
                          {demand.title && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {demand.title}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Footer com tempo e responsável */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock size={13} />
                            <span className="text-xs font-medium">
                              {formatShortTime(demand.created_at)}
                            </span>
                          </div>
                          {lastComment && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <MessageSquare size={13} />
                              <span className="text-xs font-medium">1</span>
                            </div>
                          )}
                        </div>
                        {demand.claimed_by_name && demand.status !== "open" && (
                          <Avatar
                            className={`h-5 w-5 ${getAvatarColor(demand.claimed_by_name)}`}
                          >
                            <AvatarFallback
                              className={`text-[10px] font-medium ${getAvatarColor(demand.claimed_by_name)}`}
                            >
                              {getInitials(demand.claimed_by_name)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Demandas concluídas */}
          {completedDemands.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-500" />
                Concluídas Hoje
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {completedDemands.length}
                </span>
              </h2>
              <div className="space-y-2">
                {completedDemands.map((demand) => {
                  const lastComment = lastComments[demand.id];
                  const displayName = demand.created_by_name || "Você";

                  return (
                    <div
                      key={demand.id}
                      className="bg-card rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer opacity-70 border border-border"
                      onClick={() => handleCardClick(demand)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          className={`h-9 w-9 ${getAvatarColor(displayName)}`}
                        >
                          <AvatarFallback
                            className={`text-xs font-medium ${getAvatarColor(displayName)}`}
                          >
                            {getInitials(displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground truncate">
                              {demand.demand_type_name || "Demanda"}
                            </p>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-700 dark:bg-green-500/30 dark:text-green-400 flex items-center gap-1">
                              <CheckCircle2 size={10} />
                              Concluída
                            </span>
                          </div>
                          {demand.title && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {demand.title}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock size={13} />
                            <span className="text-xs font-medium">
                              {formatShortTime(demand.created_at)}
                            </span>
                          </div>
                          {lastComment && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <MessageSquare size={13} />
                              <span className="text-xs font-medium">1</span>
                            </div>
                          )}
                        </div>
                        {demand.completed_by_name && (
                          <Avatar
                            className={`h-5 w-5 ${getAvatarColor(demand.completed_by_name)}`}
                          >
                            <AvatarFallback
                              className={`text-[10px] font-medium ${getAvatarColor(demand.completed_by_name)}`}
                            >
                              {getInitials(demand.completed_by_name)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
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
