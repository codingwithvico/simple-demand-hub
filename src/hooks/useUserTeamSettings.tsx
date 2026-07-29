import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useUserTeamSettings = () => {
  const { user } = useAuth();
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      // Buscar o profile do usuário com a equipe
      const { data: profile } = await supabase
        .from("profiles")
        .select("team_id")
        .eq("id", user.id)
        .single();

      if (!profile?.team_id) {
        // Se não tem equipe, som habilitado por padrão
        setNotificationSoundEnabled(true);
        setLoading(false);
        return;
      }

      // Buscar configuração da equipe
      const { data: team } = await supabase
        .from("teams")
        .select("notification_sound_enabled")
        .eq("id", profile.team_id)
        .single();

      setNotificationSoundEnabled(
        (team as any)?.notification_sound_enabled ?? true
      );
      setLoading(false);
    };

    fetchSettings();
  }, [user]);

  return { notificationSoundEnabled, loading };
};
