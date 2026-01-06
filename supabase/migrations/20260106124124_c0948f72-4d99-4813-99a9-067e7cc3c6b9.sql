-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_demands_created_at ON public.demands(created_at);
CREATE INDEX IF NOT EXISTS idx_demands_status ON public.demands(status);
CREATE INDEX IF NOT EXISTS idx_demands_team_id ON public.demands(team_id);
CREATE INDEX IF NOT EXISTS idx_demands_claimed_by ON public.demands(claimed_by);
CREATE INDEX IF NOT EXISTS idx_profiles_team_id ON public.profiles(team_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Helper function para simplificar policies
CREATE OR REPLACE FUNCTION public.is_master(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(uid, 'master')
$$;