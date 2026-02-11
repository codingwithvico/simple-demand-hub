import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Team {
  id: string;
  name: string;
  created_at: Date;
  notification_sound_enabled: boolean;
}

export const useTeams = (autoFetch: boolean = false) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching teams:", error);
      toast({
        title: "Erro ao carregar equipes",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setTeams(
      (data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        created_at: new Date(t.created_at!),
        notification_sound_enabled: t.notification_sound_enabled ?? true,
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchTeams();
    }
  }, [autoFetch, fetchTeams]);

  const createTeam = async (name: string) => {
    const { error } = await supabase.from("teams").insert({ name });

    if (error) {
      toast({
        title: "Erro ao criar equipe",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }

    toast({ title: "Equipe criada com sucesso" });
    await fetchTeams();
    return true;
  };

  const deleteTeam = async (id: string) => {
    const { error } = await supabase.from("teams").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir equipe",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }

    toast({ title: "Equipe excluída" });
    await fetchTeams();
    return true;
  };

  const updateTeamSound = async (id: string, enabled: boolean) => {
    const { error } = await supabase
      .from("teams")
      .update({ notification_sound_enabled: enabled })
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao atualizar configuração",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }

    toast({ title: enabled ? "Som ativado" : "Som desativado" });
    await fetchTeams();
    return true;
  };

  return {
    teams,
    loading,
    createTeam,
    deleteTeam,
    updateTeamSound,
    refetch: fetchTeams,
  };
};
