import { DemandWithProfile } from "@/types/demand";
import {
  MoreHorizontal,
  UserCheck,
  Check,
  Trash2,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DemandCardProps {
  demand: DemandWithProfile;
  onDelete: (id: string) => void;
  onClaim?: (id: string) => void;
  onComplete?: (id: string) => void;
  isClaiming?: boolean;
  isCompleting?: boolean;
  isMaster?: boolean;
}

const statusConfig = {
  open: { label: "Aberta", variant: "outline" as const },
  in_progress: { label: "Em andamento", variant: "secondary" as const },
  completed: { label: "Concluída", variant: "default" as const },
};

const DemandCard = ({
  demand,
  onDelete,
  onClaim,
  onComplete,
  isClaiming,
  isCompleting,
  isMaster,
}: DemandCardProps) => {
  const config = statusConfig[demand.status];
  const isCompleted = demand.status === "completed";
  const isLoading = isClaiming || isCompleting;

  return (
    <div
      className={`mx-4 mb-3 border border-border rounded-lg overflow-hidden transition-colors ${isCompleted ? "opacity-50" : ""}`}
      data-id={demand.id}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-border/50">
        <div className="flex items-center gap-2 min-w-0">
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
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                disabled={isLoading}
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
        {demand.title && (
          <h3 className="text-foreground font-medium text-sm mb-1">
            {demand.title}
          </h3>
        )}
        <p className="text-foreground text-[15px] leading-relaxed break-words">
          {demand.description}
        </p>
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
