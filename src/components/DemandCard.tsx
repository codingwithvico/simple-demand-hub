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
  AlertTriangle,
  Users,
} from "lucide-react";
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

// Formata o nome do usuário para menção (@usuario)
const formatUserMention = (name: string | null) => {
  if (!name) return null;
  // Remove espaços e converte para lowercase para o formato @usuario
  return name.toLowerCase().replace(/\s+/g, "");
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

// Gera cor de fundo baseada no nome (dark mode compatible)
const getAvatarColor = (name: string | null) => {
  if (!name) return "bg-muted text-muted-foreground";
  const colors = [
    "bg-blue-500/20 text-blue-400 dark:bg-blue-500/30 dark:text-blue-300",
    "bg-green-500/20 text-green-600 dark:bg-green-500/30 dark:text-green-300",
    "bg-purple-500/20 text-purple-600 dark:bg-purple-500/30 dark:text-purple-300",
    "bg-orange-500/20 text-orange-600 dark:bg-orange-500/30 dark:text-orange-300",
    "bg-pink-500/20 text-pink-600 dark:bg-pink-500/30 dark:text-pink-300",
    "bg-cyan-500/20 text-cyan-600 dark:bg-cyan-500/30 dark:text-cyan-300",
    "bg-amber-500/20 text-amber-600 dark:bg-amber-500/30 dark:text-amber-300",
    "bg-rose-500/20 text-rose-600 dark:bg-rose-500/30 dark:text-rose-300",
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

// Calcula dias de atraso
const getDaysDelayed = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
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
  const daysDelayed = demand.isDelayed ? getDaysDelayed(demand.created_at) : 0;

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

  // Tag colors based on demand type
  const getTagColor = () => {
    const typeColors: Record<string, string> = {
      default:
        "bg-purple-500/20 text-purple-600 dark:bg-purple-500/30 dark:text-purple-300",
    };
    return typeColors.default;
  };

  // Formata data para exibição
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  // Mapeia status para texto legível
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      open: "Aberta",
      in_progress: "Em andamento",
      completed: "Concluída",
    };
    return statusMap[status] || status;
  };

  // Nome do usuário responsável formatado como menção (quem assumiu a demanda)
  const responsibleUserMention = formatUserMention(demand.claimed_by_name);

  // Nome do criador da demanda formatado como menção
  const creatorUserMention = formatUserMention(demand.created_by_name);

  return (
    <div
      className={`
        rounded-xl p-3.5 cursor-pointer
        border border-[hsl(var(--kanban-card-border))]
        bg-[hsl(var(--kanban-card-bg))]
        transition-all duration-150 ease-out
        hover:-translate-y-0.5 hover:border-primary/40
        hover:shadow-lg hover:shadow-black/[0.08] dark:hover:shadow-black/30
        ${isCompleted ? "opacity-60" : ""}
      `}
      data-id={demand.id}
      onClick={handleCardClick}
    >
      {/* Header Tags Row - Tipo da Demanda e Equipe */}
      <div className="flex items-center gap-2 flex-wrap mb-2.5">
        {demand.demand_type_name && (
          <span
            className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md ${getTagColor()}`}
          >
            {demand.demand_type_name}
          </span>
        )}
        {demand.team_name &&
          demand.team_name !== "null" &&
          demand.team_name !== "NULL" && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md
              bg-muted/60 dark:bg-muted/30
              text-muted-foreground"
            >
              <Users size={10} />
              {demand.team_name}
            </span>
          )}
      </div>

      {/* Título da Demanda com Menu */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3
            className="text-[15px] font-semibold leading-snug line-clamp-2"
            style={{ color: "hsl(var(--kanban-text-primary))" }}
          >
            {displayName}
          </h3>
        </div>

        {/* Menu - apenas para masters */}
        {isMaster && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild data-radix-dropdown-menu-trigger>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10"
                style={{ color: "hsl(var(--kanban-text-secondary))" }}
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

      {/* Indicador de atraso */}
      {demand.isDelayed && (
        <div className="mt-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-500/20 text-red-500 dark:bg-red-500/30 dark:text-red-400">
            <AlertTriangle size={10} />
            {daysDelayed}d em atraso
          </span>
        </div>
      )}

      {/* Usuário que abriu a demanda (formato @menção) - coluna Recebidas */}
      {creatorUserMention && demand.status === "open" && (
        <div className="mt-2.5">
          <span
            className="inline-flex items-center text-[13px] px-2 py-0.5 rounded-full
              border border-border
              text-primary hover:text-primary/80
              transition-colors"
          >
            @{creatorUserMention}
          </span>
        </div>
      )}

      {/* Usuário Responsável (formato @menção) - coluna Em andamento */}
      {responsibleUserMention && demand.status === "in_progress" && (
        <div className="mt-2.5">
          <span
            className="inline-flex items-center text-[13px] px-2 py-0.5 rounded-full
              border border-border
              text-primary hover:text-primary/80
              transition-colors"
          >
            @{responsibleUserMention}
          </span>
        </div>
      )}

      {/* Campos adicionais da demanda */}
      <div className="mt-3 flex flex-col gap-1.5 text-[12px]">
        <div className="flex items-center gap-1.5">
          <span
            className="font-semibold"
            style={{ color: "hsl(var(--kanban-text-secondary))" }}
          >
            Criado em:
          </span>
          <span className="font-medium text-blue-600 dark:text-blue-400">
            {formatDate(demand.created_at)}
          </span>
        </div>
        {demand.title && (
          <div className="flex flex-col gap-0.5">
            <span
              className="font-semibold"
              style={{ color: "hsl(var(--kanban-text-secondary))" }}
            >
              Título:
            </span>
            <span className="font-medium text-blue-600 dark:text-blue-400 line-clamp-1">
              {demand.title}
            </span>
          </div>
        )}
        {demand.description && (
          <div className="flex flex-col gap-1">
            {demand.description.split("\n").map((line, index) => {
              const colonIndex = line.indexOf(":");
              if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim();
                const value = line.substring(colonIndex + 1).trim();
                return (
                  <div key={index} className="flex gap-1 flex-wrap">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {key}:
                    </span>
                    <span className="text-blue-600 dark:text-blue-400">
                      {value}
                    </span>
                  </div>
                );
              }
              return (
                <span key={index} className="text-blue-600 dark:text-blue-400">
                  {line}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between pt-3 mt-3"
        style={{ borderTop: "1px solid hsl(var(--kanban-card-border))" }}
      >
        <div
          className="flex items-center gap-3 text-xs"
          style={{ color: "hsl(var(--kanban-text-secondary))" }}
        >
          <div className="flex items-center gap-1">
            <Clock size={13} />
            <span>{formatShortTime(demand.created_at)}</span>
          </div>
          {commentCount > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare size={13} />
              <span>{commentCount}</span>
            </div>
          )}
        </div>
        {demand.claimed_by_name && demand.status === "in_progress" && (
          <Avatar
            className={`h-6 w-6 ${getAvatarColor(demand.claimed_by_name)}`}
            title={demand.claimed_by_name}
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
};

export default DemandCard;
