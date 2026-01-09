-- Adicionar coluna demand_type_id na tabela demands
ALTER TABLE public.demands 
ADD COLUMN demand_type_id uuid REFERENCES public.demand_types(id) ON DELETE SET NULL;

-- Criar tabela para armazenar os valores dos campos dinâmicos
CREATE TABLE public.demand_field_values (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  demand_id uuid NOT NULL REFERENCES public.demands(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES public.demand_type_fields(id) ON DELETE CASCADE,
  value text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(demand_id, field_id)
);

-- Habilitar RLS
ALTER TABLE public.demand_field_values ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para demand_field_values
-- Todos usuários autenticados podem visualizar
CREATE POLICY "Authenticated users can view demand field values"
ON public.demand_field_values
FOR SELECT
TO authenticated
USING (true);

-- Usuários podem inserir valores ao criar demandas (vinculado à demanda que criaram)
CREATE POLICY "Users can insert field values for own demands"
ON public.demand_field_values
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.demands 
    WHERE id = demand_id AND created_by = auth.uid()
  )
);

-- Masters podem gerenciar todos os valores
CREATE POLICY "Masters can manage all field values"
ON public.demand_field_values
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'master'::app_role));