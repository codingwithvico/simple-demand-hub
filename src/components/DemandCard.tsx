import { Demand } from "@/types/demand";
import { X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DemandCardProps {
  demand: Demand;
  onDelete: (id: string) => void;
}

const DemandCard = ({ demand, onDelete }: DemandCardProps) => {
  return (
    <div className="mx-4 mb-3 border border-border rounded-lg px-4 py-3 hover:bg-muted/30 transition-colors">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-foreground text-[15px] leading-relaxed break-words">
            {demand.text}
          </p>
          <span className="text-muted-foreground text-sm mt-1 block">
            {formatDistanceToNow(demand.createdAt, { addSuffix: true, locale: ptBR })}
          </span>
        </div>
        <button
          onClick={() => onDelete(demand.id)}
          className="text-muted-foreground hover:text-destructive transition-colors p-1 -mr-1"
          aria-label="Excluir demanda"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default DemandCard;
