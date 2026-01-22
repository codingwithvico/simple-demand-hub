import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Comment {
  id: string;
  demand_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string;
}

export const useComments = (demandId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", demandId],
    queryFn: async () => {
      if (!demandId) return [];

      const { data, error } = await supabase
        .from("demand_comments")
        .select(`
          id,
          demand_id,
          user_id,
          content,
          created_at,
          profiles!demand_comments_user_id_fkey(name)
        `)
        .eq("demand_id", demandId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data || []).map((comment) => ({
        id: comment.id,
        demand_id: comment.demand_id,
        user_id: comment.user_id,
        content: comment.content,
        created_at: comment.created_at,
        user_name: (comment.profiles as { name: string } | null)?.name || "Anônimo",
      }));
    },
    enabled: !!demandId,
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ demandId, content }: { demandId: string; content: string }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("demand_comments")
        .insert({
          demand_id: demandId,
          user_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", demandId] });
      queryClient.invalidateQueries({ queryKey: ["lastComments"] });
    },
    onError: (error) => {
      console.error("Erro ao adicionar comentário:", error);
      toast.error("Erro ao adicionar comentário");
    },
  });

  return {
    comments,
    isLoading,
    addComment: addCommentMutation.mutate,
    isAddingComment: addCommentMutation.isPending,
  };
};

// Hook para buscar o último comentário de múltiplas demandas
export const useLastComments = (demandIds: string[]) => {
  return useQuery({
    queryKey: ["lastComments", demandIds],
    queryFn: async () => {
      if (demandIds.length === 0) return {};

      const { data, error } = await supabase
        .from("demand_comments")
        .select(`
          id,
          demand_id,
          content,
          created_at,
          profiles!demand_comments_user_id_fkey(name)
        `)
        .in("demand_id", demandIds)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Agrupa por demand_id e pega apenas o primeiro (mais recente)
      const lastCommentByDemand: Record<string, { content: string; user_name: string; created_at: string }> = {};
      
      for (const comment of data || []) {
        if (!lastCommentByDemand[comment.demand_id]) {
          lastCommentByDemand[comment.demand_id] = {
            content: comment.content,
            user_name: (comment.profiles as { name: string } | null)?.name || "Anônimo",
            created_at: comment.created_at,
          };
        }
      }

      return lastCommentByDemand;
    },
    enabled: demandIds.length > 0,
  });
};
