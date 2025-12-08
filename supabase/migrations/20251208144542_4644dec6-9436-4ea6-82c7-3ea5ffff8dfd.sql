-- RPC para assumir (claim) uma demanda atomicamente
CREATE OR REPLACE FUNCTION public.claim_demand(demand_id uuid, master_id uuid)
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
    RAISE EXCEPTION 'Apenas masters podem assumir demandas';
  END IF;

  -- Lock row e atualiza atomicamente apenas se status = 'open'
  UPDATE demands d
  SET status = 'in_progress',
      claimed_by = master_id,
      claimed_at = now(),
      version = version + 1,
      updated_at = now()
  WHERE d.id = demand_id AND d.status = 'open'
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

-- RPC para concluir (complete) uma demanda atomicamente
CREATE OR REPLACE FUNCTION public.complete_demand(demand_id uuid, master_id uuid)
RETURNS TABLE (
  id uuid,
  status demand_status,
  completed_by uuid,
  completed_at timestamptz,
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
    RAISE EXCEPTION 'Apenas masters podem concluir demandas';
  END IF;

  -- Atualiza apenas se status é 'open' ou 'in_progress'
  UPDATE demands d
  SET status = 'completed',
      completed_by = master_id,
      completed_at = now(),
      version = version + 1,
      updated_at = now()
  WHERE d.id = demand_id AND d.status IN ('open', 'in_progress')
  RETURNING d.id, d.status, d.completed_by, d.completed_at INTO res;

  IF FOUND THEN
    RETURN QUERY SELECT res.id, res.status, res.completed_by, res.completed_at, true;
  ELSE
    -- Retorna estado atual para o cliente detectar conflito
    RETURN QUERY 
      SELECT d.id, d.status, d.completed_by, d.completed_at, false
      FROM demands d 
      WHERE d.id = demand_id;
  END IF;
END;
$$;