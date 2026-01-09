import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DemandTypeField {
  id: string;
  label: string;
  field_type: "short_text" | "long_text" | "select";
  required: boolean;
  options: string[] | null;
  sort_order: number;
}

export interface DemandType {
  id: string;
  name: string;
  fields: DemandTypeField[];
}

export const useDemandTypes = () => {
  const [demandTypes, setDemandTypes] = useState<DemandType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDemandTypes = async () => {
      // Buscar tipos de demanda
      const { data: types, error: typesError } = await supabase
        .from("demand_types")
        .select("id, name")
        .order("name", { ascending: true });

      if (typesError) {
        console.error("Error fetching demand types:", typesError);
        setLoading(false);
        return;
      }

      // Buscar campos para cada tipo
      const { data: fields, error: fieldsError } = await supabase
        .from("demand_type_fields")
        .select("*")
        .order("sort_order", { ascending: true });

      if (fieldsError) {
        console.error("Error fetching demand type fields:", fieldsError);
        setLoading(false);
        return;
      }

      // Mapear tipos com seus campos
      const typesWithFields: DemandType[] = (types || []).map((type) => ({
        id: type.id,
        name: type.name,
        fields: (fields || [])
          .filter((f) => f.demand_type_id === type.id)
          .map((f) => ({
            id: f.id,
            label: f.label,
            field_type: f.field_type as "short_text" | "long_text" | "select",
            required: f.required,
            options: f.options as string[] | null,
            sort_order: f.sort_order,
          })),
      }));

      setDemandTypes(typesWithFields);
      setLoading(false);
    };

    fetchDemandTypes();
  }, []);

  return { demandTypes, loading };
};
