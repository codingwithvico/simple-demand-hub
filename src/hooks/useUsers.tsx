import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  team_id: string | null;
  team_name: string | null;
  created_at: Date;
}

export const useUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        *,
        team:teams(name)
      `,
      )
      .order("name");

    if (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setUsers(
      (data || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        team_id: u.team_id,
        team_name: u.team?.name || null,
        created_at: new Date(u.created_at!),
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const createUser = async (data: {
    name: string;
    email: string;
    password: string;
    team_id: string;
  }) => {
    setCreating(true);

    try {
      const { data: session } = await supabase.auth.getSession();

      const response = await supabase.functions.invoke("create-user", {
        body: data,
        headers: {
          Authorization: `Bearer ${session.session?.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({ title: "Usuário criado com sucesso" });
      await fetchUsers();
      return true;
    } catch (error: any) {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setCreating(false);
    }
  };

  return { users, loading, creating, createUser, refetch: fetchUsers };
};
