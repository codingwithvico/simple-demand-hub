-- Trigger para validar que usuários com role 'user' devem ter team_id
CREATE OR REPLACE FUNCTION public.validate_user_team()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se o profile tem team_id NULL, verificar se é um master
  IF NEW.team_id IS NULL THEN
    -- Verificar se o usuário tem role 'user' (não é master)
    IF EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = NEW.id AND role = 'user'
    ) THEN
      RAISE EXCEPTION 'Usuários com role "user" devem ter uma equipe associada';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para validar no UPDATE de profiles
CREATE TRIGGER validate_profile_team
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_user_team();

-- Também validar quando role é atribuída (se profile já existe sem team)
CREATE OR REPLACE FUNCTION public.validate_role_team()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se está inserindo role 'user', verificar se profile tem team_id
  IF NEW.role = 'user' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = NEW.user_id AND team_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Não é possível atribuir role "user" a um usuário sem equipe';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_user_role_team
BEFORE INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.validate_role_team();