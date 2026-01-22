import { DemandWithProfile } from "@/types/demand";
import {
  MoreHorizontal,
  UserCheck,
  UserX,
  Check,
  Trash2,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";

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

const statusConfig = {
  open: { label: "Aberta", variant: "outline" as const },
  in_progress: { label: "Em andamento", variant: "secondary" as const },
  completed: { label: "Concluída", variant: "default" as const },
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
  const config = statusConfig[demand.status];
  const isCompleted = demand.status === "completed";
  const isLoading = isClaiming || isCompleting || isUnclaiming;
  
  // Pode desassumir se é master, está em andamento, e foi quem assumiu
  const canUnclaim = isMaster && 
    demand.status === "in_progress" && 
    demand.claimed_by === user?.id;

  const handleCardClick = (e: React.MouseEvent) => {
    // Não abrir o modal se clicar no menu dropdown
    const target = e.target as HTMLElement;
    if (target.closest('[data-radix-dropdown-menu-trigger]') || target.closest('[role="menu"]')) {
      return;
    }
    onClick?.();
  };

  return (
    <div
      className={`mx-4 mb-3 border border-border rounded-lg overflow-hidden transition-colors cursor-pointer hover:border-primary/50 ${isCompleted ? "opacity-50" : ""}`}
      data-id={demand.id}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-border/50">
        <div className="flex items-center gap-2 min-w-0">
          {queuePosition && (
            <span className="flex items-center justify-center min-w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
              #{queuePosition}
            </span>
          )}
          <strong className="text-foreground text-sm truncate">
            {demand.created_by_name || "Anônimo"}
          </strong>
          {demand.team_name && (
            <small className="text-muted-foreground text-xs">
              {demand.team_name}
            </small>
          )}
        </div>

        {/* Menu - apenas para masters */}
        {isMaster && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild data-radix-dropdown-menu-trigger>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                disabled={isLoading}
                onClick={(e) => e.stopPropagation()}
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <MoreHorizontal size={16} />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {demand.status === "open" && onClaim && (
                <DropdownMenuItem
                  onClick={() => onClaim(demand.id)}
                  disabled={isClaiming}
                >
                  <UserCheck size={14} className="mr-2" />
                  Assumir
                </DropdownMenuItem>
              )}
              {canUnclaim && onUnclaim && (
                <DropdownMenuItem
                  onClick={() => onUnclaim(demand.id)}
                  disabled={isUnclaiming}
                >
                  <UserX size={14} className="mr-2" />
                  Desassumir
                </DropdownMenuItem>
              )}
              {demand.status !== "completed" && onComplete && (
                <DropdownMenuItem
                  onClick={() => onComplete(demand.id)}
                  disabled={isCompleting}
                >
                  <Check size={14} className="mr-2" />
                  Marcar Concluída
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => onDelete(demand.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 size={14} className="mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        {demand.demand_type_name && (
          <div className="mb-2">
            <Badge variant="outline" className="text-xs">
              {demand.demand_type_name}
            </Badge>
          </div>
        )}
        {demand.title && (
          <h3 className="text-foreground font-medium text-sm mb-1">
            {demand.title}
          </h3>
        )}
        <p className="text-foreground text-[15px] leading-relaxed break-words whitespace-pre-line">
          {demand.description}
        </p>

        {/* Último comentário */}
        {lastComment && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <MessageSquare size={12} className="mt-0.5 shrink-0" />
              <div className="min-w-0">
                <span className="font-medium text-foreground/80">{lastComment.user_name}:</span>{" "}
                <span className="line-clamp-2">{lastComment.content}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border/50 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={config.variant}>{config.label}</Badge>

          {demand.claimed_by_name && demand.status !== "open" && (
            <span className="text-muted-foreground text-xs">
              Assumida por {demand.claimed_by_name}
            </span>
          )}

          {demand.completed_by_name && isCompleted && (
            <span className="text-muted-foreground text-xs">
              Concluída por {demand.completed_by_name}
            </span>
          )}
        </div>

        <span className="text-muted-foreground text-xs">
          {formatDistanceToNow(demand.created_at, {
            addSuffix: true,
            locale: ptBR,
          })}
        </span>
      </div>
    </div>
  );
};

export default DemandCard;
