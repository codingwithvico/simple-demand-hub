import { DemandWithProfile } from "@/types/demand";
import {
  MoreHorizontal,
  UserCheck,
  UserX,
  Check,
  Trash2,
  Loader2,
  MessageSquare,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DemandCardProps {
  demand: DemandWithProfile;
  queuePosition?: number;
  lastComment?: {
    content: string;
    user_name: string;
  } | null;
  onDelete: (id: string) => void;
  onClaim?: (id: string) => void;
  onComplete?: (id: string) => void;
  onUnclaim?: (id: string) => void;
  onClick?: () => void;
  isClaiming?: boolean;
  isCompleting?: boolean;
  isUnclaiming?: boolean;
  isMaster?: boolean;
}

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
  if (!name) return "bg-muted";
  const colors = [
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-purple-100 text-purple-700",
    "bg-orange-100 text-orange-700",
    "bg-pink-100 text-pink-700",
    "bg-cyan-100 text-cyan-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

// Formata tempo de forma curta (2d, 1h, etc)
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

const DemandCard = ({
  demand,
  queuePosition,
  lastComment,
  onDelete,
  onClaim,
  onComplete,
  onUnclaim,
  onClick,
  isClaiming,
  isCompleting,
  isUnclaiming,
  isMaster,
}: DemandCardProps) => {
  const { user } = useAuth();
  const isCompleted = demand.status === "completed";
  const isLoading = isClaiming || isCompleting || isUnclaiming;
  const displayName = demand.created_by_name || "Anônimo";

  // Pode desassumir se é master, está em andamento, e foi quem assumiu
  const canUnclaim =
    isMaster &&
    demand.status === "in_progress" &&
    demand.claimed_by === user?.id;

  const handleCardClick = (e: React.MouseEvent) => {
    // Não abrir o modal se clicar no menu dropdown
    const target = e.target as HTMLElement;
    if (
      target.closest("[data-radix-dropdown-menu-trigger]") ||
      target.closest('[role="menu"]')
    ) {
      return;
    }
    onClick?.();
  };

  // Conta comentários (simulado pelo lastComment)
  const commentCount = lastComment ? 1 : 0;

  return (
    <div
      className={`mx-3 mb-2 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-gray-200 ${isCompleted ? "opacity-60" : ""}`}
      data-id={demand.id}
      onClick={handleCardClick}
    >
      {/* Header com Avatar e Nome */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Posição na fila */}
          {queuePosition !== undefined && (
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
              <span className="text-xs font-bold">#{queuePosition}</span>
            </div>
          )}
          <Avatar className={`h-9 w-9 ${getAvatarColor(displayName)}`}>
            <AvatarFallback
              className={`text-xs font-medium ${getAvatarColor(displayName)}`}
            >
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {displayName}
            </p>
            {demand.demand_type_name && (
              <p className="text-xs text-gray-500 truncate">
                {demand.demand_type_name}
              </p>
            )}
          </div>
        </div>

        {/* Menu - apenas para masters */}
        {isMaster && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild data-radix-dropdown-menu-trigger>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                disabled={isLoading}
                onClick={(e) => e.stopPropagation()}
              >
                {isLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <MoreHorizontal size={14} />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
              {demand.status === "open" && onClaim && (
                <DropdownMenuItem
                  onClick={() => onClaim(demand.id)}
                  disabled={isClaiming}
                  className="text-sm"
                >
                  <UserCheck size={14} className="mr-2" />
                  Assumir
                </DropdownMenuItem>
              )}
              {canUnclaim && onUnclaim && (
                <DropdownMenuItem
                  onClick={() => onUnclaim(demand.id)}
                  disabled={isUnclaiming}
                  className="text-sm"
                >
                  <UserX size={14} className="mr-2" />
                  Desassumir
                </DropdownMenuItem>
              )}
              {demand.status !== "completed" && onComplete && (
                <DropdownMenuItem
                  onClick={() => onComplete(demand.id)}
                  disabled={isCompleting}
                  className="text-sm"
                >
                  <Check size={14} className="mr-2" />
                  Concluir
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => onDelete(demand.id)}
                className="text-sm text-destructive focus:text-destructive"
              >
                <Trash2 size={14} className="mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Footer com tempo e comentários */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-gray-400">
          <Clock size={13} />
          <span className="text-xs font-medium">
            {formatShortTime(demand.created_at)}
          </span>
        </div>
        {commentCount > 0 && (
          <div className="flex items-center gap-1.5 text-gray-400">
            <MessageSquare size={13} />
            <span className="text-xs font-medium">{commentCount}</span>
          </div>
        )}
        {demand.claimed_by_name && demand.status === "in_progress" && (
          <div className="flex items-center gap-1.5 ml-auto">
            <Avatar
              className={`h-5 w-5 ${getAvatarColor(demand.claimed_by_name)}`}
            >
              <AvatarFallback
                className={`text-[10px] font-medium ${getAvatarColor(demand.claimed_by_name)}`}
              >
                {getInitials(demand.claimed_by_name)}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemandCard;
