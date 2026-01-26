import { useState } from "react";
import { DemandWithProfile } from "@/types/demand";
import { useComments } from "@/hooks/useComments";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Send, Loader2 } from "lucide-react";

interface DemandDetailDialogProps {
  demand: DemandWithProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig = {
  open: { label: "Aberta", variant: "outline" as const },
  in_progress: { label: "Em andamento", variant: "secondary" as const },
  completed: { label: "Concluída", variant: "default" as const },
};

const DemandDetailDialog = ({
  demand,
  open,
  onOpenChange,
}: DemandDetailDialogProps) => {
  const [newComment, setNewComment] = useState("");
  const { comments, isLoading, addComment, isAddingComment } = useComments(
    demand?.id || null
  );

  if (!demand) return null;

  const config = statusConfig[demand.status];

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !demand) return;

    addComment(
      { demandId: demand.id, content: newComment.trim() },
      {
        onSuccess: () => setNewComment(""),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {demand.demand_type_name && (
              <Badge variant="outline" className="text-xs font-normal">
                {demand.demand_type_name}
              </Badge>
            )}
            <span className="truncate">{demand.title || "Demanda"}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Informações da demanda */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap text-sm">
              <Badge variant={config.variant}>{config.label}</Badge>
              <span className="text-muted-foreground">
                Criada por <strong>{demand.created_by_name || "Anônimo"}</strong>
              </span>
              {demand.team_name && (
                <span className="text-muted-foreground">• {demand.team_name}</span>
              )}
              <span className="text-muted-foreground">
                •{" "}
                {formatDistanceToNow(demand.created_at, {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </div>

            <p className="text-foreground text-[15px] leading-relaxed break-words whitespace-pre-line bg-muted/50 p-3 rounded-lg">
              {demand.description}
            </p>

            {demand.claimed_by_name && demand.status !== "open" && (
              <p className="text-sm text-muted-foreground">
                Assumida por <strong>{demand.claimed_by_name}</strong>
                {demand.claimed_at &&
                  ` em ${format(new Date(demand.claimed_at), "dd/MM 'às' HH:mm", { locale: ptBR })}`}
              </p>
            )}

            {demand.completed_by_name && demand.status === "completed" && (
              <p className="text-sm text-muted-foreground">
                Concluída por <strong>{demand.completed_by_name}</strong>
                {demand.completed_at &&
                  ` em ${format(new Date(demand.completed_at), "dd/MM 'às' HH:mm", { locale: ptBR })}`}
              </p>
            )}
          </div>

          <Separator />

          {/* Seção de comentários */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={16} className="text-muted-foreground" />
              <h3 className="font-medium text-sm">
                Comentários ({comments.length})
              </h3>
            </div>

            <ScrollArea className="flex-1 min-h-[150px] max-h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-muted-foreground" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  Nenhum comentário ainda
                </p>
              ) : (
                <div className="space-y-3 pr-4">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-muted/30 rounded-lg p-3 text-sm"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <strong className="text-foreground text-xs">
                          {comment.user_name}
                        </strong>
                        <span className="text-muted-foreground text-xs">
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      <p className="text-foreground leading-relaxed whitespace-pre-line">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Formulário de novo comentário */}
            <form onSubmit={handleSubmitComment} className="mt-3 flex gap-2">
              <Textarea
                placeholder="Adicionar comentário..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[60px] resize-none"
                disabled={isAddingComment}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!newComment.trim() || isAddingComment}
                className="shrink-0 self-end"
              >
                {isAddingComment ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DemandDetailDialog;
