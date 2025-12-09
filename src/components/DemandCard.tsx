import { DemandWithProfile } from "@/types/demand";
import { X, Check, UserCheck, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

  return (
    <div className={`mx-4 mb-3 border border-border rounded-lg px-4 py-3 hover:bg-muted/30 transition-colors ${demand.status === "completed" ? "opacity-50" : ""}`}>
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          {demand.title && (
            <h3 className="text-foreground font-medium text-sm mb-1">
              {demand.title}
            </h3>
          )}
          <p className="text-foreground text-[15px] leading-relaxed break-words">
            {demand.description}
          </p>
          
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant={config.variant}>{config.label}</Badge>
            <span className="text-muted-foreground text-sm">
              {formatDistanceToNow(demand.created_at, {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          </div>

          {demand.created_by_name && (
            <p className="text-muted-foreground text-xs mt-1">
              Por {demand.created_by_name}
            </p>
          )}

          {demand.claimed_by_name && demand.status !== "open" && (
            <p className="text-muted-foreground text-xs">
              Assumida por {demand.claimed_by_name}
            </p>
          )}
          
          {demand.completed_by_name && demand.status === "completed" && (
            <p className="text-muted-foreground text-xs">
              Concluída por {demand.completed_by_name}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          {isMaster && demand.status === "open" && onClaim && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onClaim(demand.id)}
              disabled={isClaiming}
              className="text-muted-foreground hover:text-primary"
              aria-label="Assumir demanda"
            >
              {isClaiming ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <UserCheck size={16} />
              )}
            </Button>
          )}

          {isMaster && demand.status !== "completed" && onComplete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onComplete(demand.id)}
              disabled={isCompleting}
              className="text-muted-foreground hover:text-green-600"
              aria-label="Concluir demanda"
            >
              {isCompleting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Check size={16} />
              )}
            </Button>
          )}

          {isMaster && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(demand.id)}
              className="text-muted-foreground hover:text-destructive"
              aria-label="Excluir demanda"
            >
              <X size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemandCard;
