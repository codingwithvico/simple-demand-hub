import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface MatriculaDuplicate {
  demandId: string;
  createdByName: string;
  createdAt: Date;
  formatted: string;
}

export const normalizeMatricula = (value: string) => value.replace(/\s+/g, "");

export const findMatriculaDuplicate = async (
  value: string,
  fieldIds: string[],
): Promise<MatriculaDuplicate | null> => {
  const normalized = normalizeMatricula(value);
  if (!normalized || fieldIds.length === 0) return null;

  // Bloqueio válido apenas para solicitações feitas nas últimas 24h
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: values, error } = await supabase
    .from("demand_field_values")
    .select("demand_id")
    .in("field_id", fieldIds)
    .ilike("value", normalized);

  if (error) {
    console.error("[useMatriculaCheck] erro ao buscar valores:", error);
    return null;
  }

  const demandIds = Array.from(
    new Set((values || []).map((v) => v.demand_id).filter(Boolean)),
  ) as string[];

  if (demandIds.length === 0) return null;

  const { data: demands, error: demandsError } = await supabase
    .from("demands")
    .select(
      "id, created_at, status, created_by, created_by_profile:profiles!demands_created_by_fkey(name)",
    )
    .in("id", demandIds)
    .in("status", ["open", "in_progress", "completed"])
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1);

  if (demandsError) {
    console.error("[useMatriculaCheck] erro ao buscar demandas:", demandsError);
    return null;
  }

  const demand = demands?.[0] as any;
  if (!demand) return null;

  const createdAt = new Date(demand.created_at);

  return {
    demandId: demand.id,
    createdByName: demand.created_by_profile?.name || "Usuário desconhecido",
    createdAt,
    formatted: format(createdAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
  };
};

export const useMatriculaCheck = (value: string, fieldIds: string[]) => {
  const [checking, setChecking] = useState(false);
  const [duplicate, setDuplicate] = useState<MatriculaDuplicate | null>(null);

  const key = fieldIds.join(",");

  useEffect(() => {
    const normalized = normalizeMatricula(value);

    if (!normalized || fieldIds.length === 0) {
      setChecking(false);
      setDuplicate(null);
      return;
    }

    let cancelled = false;
    setChecking(true);

    const timer = setTimeout(async () => {
      const result = await findMatriculaDuplicate(normalized, fieldIds);
      if (cancelled) return;
      setDuplicate(result);
      setChecking(false);
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, key]);

  return { checking, duplicate };
};
