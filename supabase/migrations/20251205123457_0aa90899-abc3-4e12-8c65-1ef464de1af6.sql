-- Enum para status de demanda
CREATE TYPE public.demand_status AS ENUM ('open', 'in_progress', 'completed');

-- Enum para roles
CREATE TYPE public.app_role AS ENUM ('master', 'user');

-- Equipes
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Perfis de usuário (metadados além do auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabela separada para roles (segurança)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Demandas
CREATE TABLE public.demands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  description text NOT NULL,
  created_by uuid REFERENCES public.profiles(id),
  team_id uuid REFERENCES public.teams(id),
  status demand_status DEFAULT 'open',
  claimed_by uuid REFERENCES public.profiles(id),
  claimed_at timestamptz,
  completed_by uuid REFERENCES public.profiles(id),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  version int DEFAULT 1
);

-- Função para verificar role (security definer evita recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at em demands
CREATE TRIGGER update_demands_updated_at
  BEFORE UPDATE ON public.demands
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar profile quando usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger para criar profile automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Habilitar RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;

-- RLS: Teams (todos autenticados podem ver)
CREATE POLICY "Authenticated users can view teams"
  ON public.teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Masters can manage teams"
  ON public.teams FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'master'));

-- RLS: Profiles (todos autenticados podem ver)
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- RLS: User Roles (só masters podem gerenciar)
CREATE POLICY "Authenticated users can view roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Masters can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'master'));

-- RLS: Demands
CREATE POLICY "Authenticated users can view demands"
  ON public.demands FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create demands"
  ON public.demands FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Masters can update any demand"
  ON public.demands FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'master'));

CREATE POLICY "Users can update own demands"
  ON public.demands FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Masters can delete demands"
  ON public.demands FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'master'));