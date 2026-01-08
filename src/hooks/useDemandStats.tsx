import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DemandStats {
  open_count: number;
  in_progress_count: number;
  completed_count: number;
  total_count: number;
}

export function useDemandStats() {
  const [stats, setStats] = useState<DemandStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(
    async (
      startDate?: Date | null,
      endDate?: Date | null,
      teamId?: string | null,
    ) => {
      setLoading(true);

      const { data, error } = await supabase.rpc("get_demand_stats", {
        start_date: startDate?.toISOString() || null,
        end_date: endDate?.toISOString() || null,
        filter_team_id: teamId || null,
      });

      if (!error && data && data.length > 0) {
        setStats(data[0] as DemandStats);
      } else {
        setStats({
          open_count: 0,
          in_progress_count: 0,
          completed_count: 0,
          total_count: 0,
        });
      }

      setLoading(false);
    },
    [],
  );

  return { stats, loading, fetchStats };
}
