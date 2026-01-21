import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DemandWithProfile } from "@/types/demand";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

interface FieldValue {
  fieldId: string;
  value: string;
}

interface CreateDemandData {
  demandTypeId: string;
  fieldValues: FieldValue[];
}

// Áudio de notificação
let notificationAudio: HTMLAudioElement | null = null;

const getNotificationAudio = () => {
  if (!notificationAudio) {
    notificationAudio = new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3",
    );
    notificationAudio.volume = 0.5;
  }
  return notificationAudio;
};

// Solicita permissão para notificações do navegador
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.warn("Este navegador não suporta notificações");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

// Envia notificação do sistema (funciona mesmo em outra aba)
const sendBrowserNotification = (title: string, body: string) => {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  // Só envia notificação se a página não estiver visível
  if (document.visibilityState === "hidden") {
    const notification = new Notification(title, {
      body,
      icon: "/favicon.ico", // Pode trocar por um ícone personalizado
      tag: "demand-notification", // Agrupa notificações do mesmo tipo
      requireInteraction: false,
    });

    // Ao clicar na notificação, foca na aba da aplicação
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Fecha automaticamente após 5 segundos
    setTimeout(() => notification.close(), 5000);
  }
};

export const useDemands = (teamSoundEnabled: boolean = true) => {
  const { user } = useAuth();
  const [demands, setDemands] = useState<DemandWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [unclaimingId, setUnclaimingId] = useState<string | null>(null);

  const fetchDemands = useCallback(async () => {
    const { data, error } = await supabase
      .from("demands")
      .select(
        `
        *,
        claimed_by_profile:profiles!demands_claimed_by_fkey(name),
        completed_by_profile:profiles!demands_completed_by_fkey(name),
        created_by_profile:profiles!demands_created_by_fkey(name),
        team:teams!demands_team_id_fkey(name),
        demand_type:demand_types!demands_demand_type_id_fkey(id, name)
      `,
      )
      .order("created_at", { ascending: true });

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
      demand_type_id: d.demand_type_id,
      demand_type_name: d.demand_type?.name || null,
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
      team_name: d.team?.name || null,
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
        async (payload) => {
          const newDemand = payload.new as any;
          // Notifica se não for o próprio usuário que criou
          if (newDemand.created_by !== user?.id) {
            // Toca som de notificação
            if (teamSoundEnabled) {
              try {
                getNotificationAudio()
                  .play()
                  .catch(() => {});
              } catch (e) {
                // Ignora erros de áudio (ex: autoplay bloqueado)
              }
            }

            // Busca o nome do criador e tipo de demanda para exibir no toast
            const [profileRes, demandTypeRes] = await Promise.all([
              newDemand.created_by
                ? supabase
                    .from("profiles")
                    .select("name")
                    .eq("id", newDemand.created_by)
                    .single()
                : Promise.resolve({ data: null }),
              newDemand.demand_type_id
                ? supabase
                    .from("demand_types")
                    .select("name")
                    .eq("id", newDemand.demand_type_id)
                    .single()
                : Promise.resolve({ data: null }),
            ]);

            const creatorName = profileRes.data?.name || "Usuário";
            const demandTypeName = demandTypeRes.data?.name || "Nova demanda";

            // Notificação do navegador (funciona mesmo em outra aba)
            sendBrowserNotification(
              `📋 ${demandTypeName}`,
              `${creatorName} publicou uma nova demanda`,
            );

            // Toast visual de notificação (só aparece se estiver na aba)
            toast({
              title: "📋 " + demandTypeName,
              description: `${creatorName} publicou uma nova demanda`,
            });
          }
          // Para INSERT, refetch para pegar os dados completos com profiles
          fetchDemands();
        },
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
            .in(
              "id",
              [
                updated.claimed_by,
                updated.completed_by,
                updated.created_by,
              ].filter(Boolean),
            );

          const getProfileName = (id: string | null) =>
            profiles?.find((p) => p.id === id)?.name || null;

          setDemands((prev) =>
            prev.map((d) =>
              d.id === updated.id
                ? {
                    ...d,
                    status: updated.status,
                    claimed_by: updated.claimed_by,
                    claimed_at: updated.claimed_at
                      ? new Date(updated.claimed_at)
                      : null,
                    completed_by: updated.completed_by,
                    completed_at: updated.completed_at
                      ? new Date(updated.completed_at)
                      : null,
                    version: updated.version,
                    updated_at: new Date(updated.updated_at),
                    claimed_by_name: getProfileName(updated.claimed_by),
                    completed_by_name: getProfileName(updated.completed_by),
                  }
                : d,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "demands" },
        (payload) => {
          // Remove o card deletado
          const deleted = payload.old as any;
          setDemands((prev) => prev.filter((d) => d.id !== deleted.id));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDemands, teamSoundEnabled, user?.id]);

  const createDemand = async (data: CreateDemandData) => {
    if (!user) return;

    const { demandTypeId, fieldValues } = data;

    // Buscar os campos do tipo para gerar descrição
    const { data: fields } = await supabase
      .from("demand_type_fields")
      .select("id, label")
      .eq("demand_type_id", demandTypeId)
      .order("sort_order", { ascending: true });

    // Gerar descrição legível a partir dos campos
    const fieldLabels = new Map(fields?.map((f) => [f.id, f.label]) || []);
    const descriptionParts = fieldValues
      .map((fv) => {
        const label = fieldLabels.get(fv.fieldId);
        return label ? `${label}: ${fv.value}` : fv.value;
      })
      .filter(Boolean);

    const description = descriptionParts.join("\n");

    // Criar a demanda
    const { data: demand, error: demandError } = await supabase
      .from("demands")
      .insert({
        description,
        demand_type_id: demandTypeId,
        created_by: user.id,
      })
      .select()
      .single();

    if (demandError) {
      console.error("Error creating demand:", demandError);
      toast({
        title: "Erro ao criar demanda",
        description: demandError.message,
        variant: "destructive",
      });
      return;
    }

    // Inserir valores dos campos
    if (fieldValues.length > 0) {
      const valuesToInsert = fieldValues.map((fv) => ({
        demand_id: demand.id,
        field_id: fv.fieldId,
        value: fv.value,
      }));

      const { error: valuesError } = await supabase
        .from("demand_field_values")
        .insert(valuesToInsert);

      if (valuesError) {
        console.error("Error inserting field values:", valuesError);
        // Não falhar a criação se os valores não foram inseridos
      }
    }

    toast({
      title: "Demanda criada",
      description: "Sua demanda foi publicada com sucesso.",
    });
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

  const unclaimDemand = async (demandId: string) => {
    if (!user) return;

    setUnclaimingId(demandId);

    try {
      const { data, error } = await supabase.rpc("unclaim_demand", {
        demand_id: demandId,
        master_id: user.id,
      });

      if (error) {
        toast({
          title: "Erro ao desassumir demanda",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      const result = data?.[0];
      if (!result?.was_updated) {
        await fetchDemands();
        toast({
          title: "Não foi possível desassumir",
          description: "Esta demanda não pode ser desassumida.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Demanda liberada",
          description: "A demanda voltou para aberta.",
        });
      }
    } finally {
      setUnclaimingId(null);
    }
  };

  return {
    demands,
    loading,
    claimingId,
    completingId,
    unclaimingId,
    createDemand,
    claimDemand,
    completeDemand,
    unclaimDemand,
    deleteDemand,
    refetch: fetchDemands,
  };
};
