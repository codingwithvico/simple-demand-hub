-- RPC para desassumir (unclaim) uma demanda atomicamente
CREATE OR REPLACE FUNCTION public.unclaim_demand(demand_id uuid, master_id uuid)
RETURNS TABLE (
  id uuid,
  status demand_status,
  claimed_by uuid,
  claimed_at timestamptz,
  was_updated boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  res RECORD;
BEGIN
  -- Verificar se o usuário é master
  IF NOT has_role(master_id, 'master') THEN
    RAISE EXCEPTION 'Apenas masters podem desassumir demandas';
  END IF;

  -- Atualiza apenas se status = 'in_progress' e o master é quem assumiu
  UPDATE demands d
  SET status = 'open',
      claimed_by = NULL,
      claimed_at = NULL,
      version = version + 1,
      updated_at = now()
  WHERE d.id = demand_id 
    AND d.status = 'in_progress' 
    AND d.claimed_by = master_id
  RETURNING d.id, d.status, d.claimed_by, d.claimed_at INTO res;

  IF FOUND THEN
    RETURN QUERY SELECT res.id, res.status, res.claimed_by, res.claimed_at, true;
  ELSE
    -- Retorna estado atual para o cliente detectar conflito
    RETURN QUERY 
      SELECT d.id, d.status, d.claimed_by, d.claimed_at, false
      FROM demands d 
      WHERE d.id = demand_id;
  END IF;
END;
$$;

-- Adicionar coluna de configuração de som na tabela teams
ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS notification_sound_enabled boolean DEFAULT true;