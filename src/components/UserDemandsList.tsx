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
    bgColor: "bg-gray-100",
    textColor: "text-gray-600",
  },
  in_progress: {
    label: "Em andamento",
    icon: Loader2,
    bgColor: "bg-amber-100",
    textColor: "text-amber-700",
  },
  completed: {
    label: "Concluída",
    icon: CheckCircle2,
    bgColor: "bg-green-100",
    textColor: "text-green-700",
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
  if (!name) return "bg-gray-200 text-gray-600";
  const colors = [
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-purple-100 text-purple-700",
    "bg-orange-100 text-orange-700",
    "bg-pink-100 text-pink-700",
    "bg-cyan-100 text-cyan-700",
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
        <div className="text-gray-300 mb-4">
          <MessageSquare size={48} strokeWidth={1} />
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          Nenhuma demanda criada hoje
        </h3>
        <p className="text-sm text-gray-500 max-w-md">
          Use o formulário acima para criar uma nova demanda. Ela aparecerá aqui
          e você poderá acompanhar o andamento.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 h-[calc(100vh-280px)]">
        <ScrollArea className="h-full pr-4">
          {/* Demandas pendentes */}
          {pendingDemands.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Clock size={16} className="text-gray-400" />
                Minhas Demandas em Aberto
                <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
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
                      className="bg-white rounded-xl p-4 shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-3">
                        {/* Posição na fila */}
                        {demand.status === "open" && (
                          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                            <span className="text-xs font-bold">#{pendingDemands.indexOf(demand) + 1}</span>
                          </div>
                        )}
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
                            <p className="text-sm font-medium text-gray-900 truncate">
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
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {demand.title}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Descrição da demanda */}
                      {demand.description && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {demand.description}
                        </p>
                      )}

                      {/* Footer com tempo e responsável */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <Clock size={13} />
                            <span className="text-xs font-medium">
                              {formatShortTime(demand.created_at)}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCardClick(demand)}
                            className="flex items-center gap-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                          >
                            <MessageSquare size={13} />
                            <span className="text-xs font-medium">
                              {lastComment ? "Ver comentários" : "Comentar"}
                            </span>
                          </button>
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
              <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-500" />
                Concluídas Hoje
                <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
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
                      className="bg-white rounded-xl p-4 shadow-sm transition-all opacity-70"
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
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {demand.demand_type_name || "Demanda"}
                            </p>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                              <CheckCircle2 size={10} />
                              Concluída
                            </span>
                          </div>
                          {demand.title && (
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {demand.title}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Descrição da demanda */}
                      {demand.description && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {demand.description}
                        </p>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <Clock size={13} />
                            <span className="text-xs font-medium">
                              {formatShortTime(demand.created_at)}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCardClick(demand)}
                            className="flex items-center gap-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                          >
                            <MessageSquare size={13} />
                            <span className="text-xs font-medium">
                              {lastComment ? "Ver comentários" : "Comentar"}
                            </span>
                          </button>
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
