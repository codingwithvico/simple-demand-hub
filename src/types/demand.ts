import { Database } from "@/integrations/supabase/types";

export type DemandStatus = Database["public"]["Enums"]["demand_status"];

export interface Demand {
  id: string;
  description: string;
  title: string | null;
  status: DemandStatus;
  created_by: string | null;
  team_id: string | null;
  claimed_by: string | null;
  claimed_at: Date | null;
  completed_by: string | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
  version: number;
}

export interface DemandWithProfile extends Demand {
  claimed_by_name?: string | null;
  completed_by_name?: string | null;
  created_by_name?: string | null;
}
