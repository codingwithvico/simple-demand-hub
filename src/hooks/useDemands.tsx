import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Demand, DemandWithProfile } from "@/types/demand";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export const useDemands = () => {
  const { user } = useAuth();
  const [demands, setDemands] = useState<DemandWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const fetchDemands = useCallback(async () => {
    const { data, error } = await supabase
      .from("demands")
      .select(`
        *,
        claimed_by_profile:profiles!demands_claimed_by_fkey(name),
        completed_by_profile:profiles!demands_completed_by_fkey(name),
        created_by_profile:profiles!demands_created_by_fkey(name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching demands:", error);
      toast({
        title: "Erro ao carregar demandas",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const mapped: DemandWithProfile[] = (data || []).map((d: any) => ({
      id: d.id,
      description: d.description,
      title: d.title,
      status: d.status,
      created_by: d.created_by,
      team_id: d.team_id,
      claimed_by: d.claimed_by,
      claimed_at: d.claimed_at ? new Date(d.claimed_at) : null,
      completed_by: d.completed_by,
      completed_at: d.completed_at ? new Date(d.completed_at) : null,
      created_at: new Date(d.created_at),
      updated_at: new Date(d.updated_at),
      version: d.version,
      claimed_by_name: d.claimed_by_profile?.name || null,
      completed_by_name: d.completed_by_profile?.name || null,
      created_by_name: d.created_by_profile?.name || null,
    }));

    setDemands(mapped);
    setLoading(false);
  }, []);

  // Real-time subscription - atualiza apenas o card alterado
  useEffect(() => {
    fetchDemands();

    const channel = supabase
      .channel("demands-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "demands" },
        () => {
          // Para INSERT, refetch para pegar os dados completos com profiles
          fetchDemands();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "demands" },
        async (payload) => {
          // Para UPDATE, atualiza apenas o card específico
          const updated = payload.new as any;
          
          // Busca os nomes dos profiles associados
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, name")
            .in("id", [updated.claimed_by, updated.completed_by, updated.created_by].filter(Boolean));
          
          const getProfileName = (id: string | null) => 
            profiles?.find(p => p.id === id)?.name || null;

          setDemands(prev => prev.map(d => 
            d.id === updated.id 
              ? {
                  ...d,
                  status: updated.status,
                  claimed_by: updated.claimed_by,
                  claimed_at: updated.claimed_at ? new Date(updated.claimed_at) : null,
                  completed_by: updated.completed_by,
                  completed_at: updated.completed_at ? new Date(updated.completed_at) : null,
                  version: updated.version,
                  updated_at: new Date(updated.updated_at),
                  claimed_by_name: getProfileName(updated.claimed_by),
                  completed_by_name: getProfileName(updated.completed_by),
                }
              : d
          ));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "demands" },
        (payload) => {
          // Remove o card deletado
          const deleted = payload.old as any;
          setDemands(prev => prev.filter(d => d.id !== deleted.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDemands]);

  const createDemand = async (description: string, title?: string) => {
    if (!user) return;

    const { error } = await supabase.from("demands").insert({
      description,
      title: title || null,
      created_by: user.id,
    });

    if (error) {
      console.error("Error creating demand:", error);
      toast({
        title: "Erro ao criar demanda",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const claimDemand = async (demandId: string) => {
    if (!user) return;

    setClaimingId(demandId);

    try {
      const { data, error } = await supabase.rpc("claim_demand", {
        demand_id: demandId,
        master_id: user.id,
      });

      if (error) {
        toast({
          title: "Erro ao assumir demanda",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      const result = data?.[0];
      if (!result?.was_updated) {
        // Conflito: já foi assumida por outro
        await fetchDemands();
        toast({
          title: "Demanda já assumida",
          description: "Esta demanda já foi assumida por outro usuário.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Demanda assumida",
          description: "Você assumiu esta demanda com sucesso.",
        });
      }
    } finally {
      setClaimingId(null);
    }
  };

  const completeDemand = async (demandId: string) => {
    if (!user) return;

    setCompletingId(demandId);

    try {
      const { data, error } = await supabase.rpc("complete_demand", {
        demand_id: demandId,
        master_id: user.id,
      });

      if (error) {
        toast({
          title: "Erro ao concluir demanda",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      const result = data?.[0];
      if (!result?.was_updated) {
        await fetchDemands();
        toast({
          title: "Demanda já concluída",
          description: "Esta demanda já foi concluída.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Demanda concluída",
          description: "Demanda marcada como concluída com sucesso.",
        });
      }
    } finally {
      setCompletingId(null);
    }
  };

  const deleteDemand = async (demandId: string) => {
    const { error } = await supabase
      .from("demands")
      .delete()
      .eq("id", demandId);

    if (error) {
      toast({
        title: "Erro ao excluir demanda",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    demands,
    loading,
    claimingId,
    completingId,
    createDemand,
    claimDemand,
    completeDemand,
    deleteDemand,
    refetch: fetchDemands,
  };
};
