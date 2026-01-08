-- Tabela de tipos de demanda
CREATE TABLE public.demand_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de campos do layout
CREATE TABLE public.demand_type_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_type_id uuid NOT NULL REFERENCES public.demand_types(id) ON DELETE CASCADE,
  label text NOT NULL,
  field_type text NOT NULL CHECK (field_type IN ('short_text', 'long_text', 'select')),
  required boolean NOT NULL DEFAULT false,
  options jsonb DEFAULT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Índice para ordenação
CREATE INDEX idx_demand_type_fields_order ON public.demand_type_fields(demand_type_id, sort_order);

-- Habilitar RLS
ALTER TABLE public.demand_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_type_fields ENABLE ROW LEVEL SECURITY;

-- Políticas para demand_types
CREATE POLICY "Authenticated users can view demand types"
ON public.demand_types FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Masters can manage demand types"
ON public.demand_types FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'master'))
WITH CHECK (public.has_role(auth.uid(), 'master'));

-- Políticas para demand_type_fields
CREATE POLICY "Authenticated users can view demand type fields"
ON public.demand_type_fields FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Masters can manage demand type fields"
ON public.demand_type_fields FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'master'))
WITH CHECK (public.has_role(auth.uid(), 'master'));

-- Trigger para updated_at
CREATE TRIGGER update_demand_types_updated_at
BEFORE UPDATE ON public.demand_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();