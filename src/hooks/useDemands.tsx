import { useState, useEffect, useCallback, useRef } from "react";
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

// Áudios de notificação
let newDemandAudio: HTMLAudioElement | null = null;
let demandClaimedAudio: HTMLAudioElement | null = null;
let demandCompletedAudio: HTMLAudioElement | null = null;

// Som para nova demanda (apenas para admins/masters)
const getNewDemandAudio = () => {
  if (!newDemandAudio) {
    newDemandAudio = new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3",
    );
    newDemandAudio.volume = 0.5;
  }
  return newDemandAudio;
};

// Som quando demanda é assumida (para quem criou a demanda)
const getDemandClaimedAudio = () => {
  if (!demandClaimedAudio) {
    demandClaimedAudio = new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2867/2867-preview.mp3",
    );
    demandClaimedAudio.volume = 0.5;
  }
  return demandClaimedAudio;
};

// Som quando demanda é concluída (para quem criou a demanda)
const getDemandCompletedAudio = () => {
  if (!demandCompletedAudio) {
    demandCompletedAudio = new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2576/2576-preview.mp3",
    );
    demandCompletedAudio.volume = 0.5;
  }
  return demandCompletedAudio;
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

export const useDemands = (
  teamSoundEnabled: boolean = true,
  isMaster: boolean = false,
) => {
  const { user } = useAuth();
  const [demands, setDemands] = useState<DemandWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [unclaimingId, setUnclaimingId] = useState<string | null>(null);

  // Ref para acessar o estado atual das demands dentro do callback do realtime
  const demandsRef = useRef<DemandWithProfile[]>([]);
  demandsRef.current = demands;

  const fetchDemands = useCallback(async () => {
    // Calcula o início e fim do dia atual
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1,
    );

    // Monta a query base
    // Busca: todas open/in_progress (qualquer data) + completed do dia
    let query = supabase
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
      .or(`status.in.(open,in_progress),and(status.eq.completed,completed_at.gte.${startOfDay.toISOString()})`);

    // Se não for master, filtra apenas as demandas criadas pelo próprio usuário
    if (!isMaster && user?.id) {
      query = query.eq("created_by", user.id);
    }

    const { data, error } = await query.order("created_at", {
      ascending: true,
    });

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
  }, [isMaster, user?.id]);

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
          // Notifica apenas admins/masters quando uma nova demanda é criada
          // e não é o próprio usuário que criou
          if (newDemand.created_by !== user?.id && isMaster) {
            // Toca som de notificação apenas para masters
            if (teamSoundEnabled) {
              try {
                getNewDemandAudio()
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
          const oldData = payload.old as any;

          // Busca a demanda atual do estado para comparar
          // (oldData do realtime pode não ter todos os campos sem REPLICA IDENTITY FULL)
          const currentDemand = demandsRef.current.find(
            (d) => d.id === updated.id,
          );

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

          // Detecta se a demanda foi assumida agora
          // Usa o estado local para comparar, pois oldData pode não ter o status anterior
          const wasJustClaimed =
            updated.status === "in_progress" &&
            updated.claimed_by &&
            currentDemand?.status === "open";

          // Notifica o criador da demanda quando ela é assumida
          if (
            wasJustClaimed &&
            updated.created_by === user?.id &&
            updated.claimed_by !== user?.id
          ) {
            if (teamSoundEnabled) {
              try {
                getDemandClaimedAudio()
                  .play()
                  .catch(() => {});
              } catch (e) {
                // Ignora erros de áudio
              }
            }
            const claimerName = getProfileName(updated.claimed_by) || "Alguém";
            sendBrowserNotification(
              "🎯 Demanda assumida",
              `${claimerName} assumiu sua demanda`,
            );
            toast({
              title: "🎯 Demanda assumida",
              description: `${claimerName} assumiu sua demanda`,
            });
          }

          // Detecta se a demanda foi concluída agora
          const wasJustCompleted =
            updated.status === "completed" &&
            currentDemand?.status !== "completed";

          // Notifica o criador da demanda quando ela é concluída
          if (
            wasJustCompleted &&
            updated.created_by === user?.id &&
            updated.completed_by !== user?.id
          ) {
            if (teamSoundEnabled) {
              try {
                getDemandCompletedAudio()
                  .play()
                  .catch(() => {});
              } catch (e) {
                // Ignora erros de áudio
              }
            }
            const completerName =
              getProfileName(updated.completed_by) || "Alguém";
            sendBrowserNotification(
              "✅ Demanda concluída",
              `${completerName} concluiu sua demanda`,
            );
            toast({
              title: "✅ Demanda concluída",
              description: `${completerName} concluiu sua demanda`,
            });
          }

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
  }, [fetchDemands, teamSoundEnabled, user?.id, isMaster]);

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
