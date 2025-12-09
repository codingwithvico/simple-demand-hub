-- Índices para performance em relatórios
CREATE INDEX IF NOT EXISTS idx_demands_created_at ON demands (created_at);
CREATE INDEX IF NOT EXISTS idx_demands_status ON demands (status);
CREATE INDEX IF NOT EXISTS idx_demands_team_id ON demands (team_id);

-- Função RPC para estatísticas de demandas
CREATE OR REPLACE FUNCTION get_demand_stats(
  start_date timestamptz DEFAULT NULL,
  end_date timestamptz DEFAULT NULL,
  filter_team_id uuid DEFAULT NULL
)
RETURNS TABLE (
  open_count bigint,
  in_progress_count bigint,
  completed_count bigint,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status = 'open')::bigint as open_count,
    COUNT(*) FILTER (WHERE status = 'in_progress')::bigint as in_progress_count,
    COUNT(*) FILTER (WHERE status = 'completed')::bigint as completed_count,
    COUNT(*)::bigint as total_count
  FROM demands
  WHERE 
    (start_date IS NULL OR created_at >= start_date)
    AND (end_date IS NULL OR created_at < end_date)
    AND (filter_team_id IS NULL OR team_id = filter_team_id);
END;
$$;