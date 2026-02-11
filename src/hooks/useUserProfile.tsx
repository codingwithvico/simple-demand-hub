import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface UserProfile {
  id: string;
  name: string | null;
  team_id: string | null;
  team_name: string | null;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          id,
          name,
          team_id,
          team:teams!profiles_team_id_fkey(name)
        `,
        )
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        setLoading(false);
        return;
      }

      setProfile({
        id: data.id,
        name: data.name,
        team_id: data.team_id,
        team_name: data.team?.name || null,
      });
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  return { profile, loading };
};
