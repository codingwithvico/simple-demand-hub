import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDemandTypes, DemandType } from "@/hooks/useDemandTypes";
import { Loader2 } from "lucide-react";

interface FieldValue {
  fieldId: string;
  value: string;
}

interface DemandInputProps {
  onSubmit: (data: { demandTypeId: string; fieldValues: FieldValue[] }) => void;
}

const DemandInput = ({ onSubmit }: DemandInputProps) => {
  const { demandTypes, loading } = useDemandTypes();
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedType = demandTypes.find((t) => t.id === selectedTypeId);

  // Resetar valores quando mudar o tipo
  useEffect(() => {
    setFieldValues({});
  }, [selectedTypeId]);

  const handleFieldChange = (fieldId: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const validateForm = (): boolean => {
    if (!selectedType) return false;

    // Validar campos obrigatórios
    for (const field of selectedType.fields) {
      if (field.required) {
        const value = fieldValues[field.id]?.trim();
        if (!value) return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !selectedTypeId) return;

    setIsSubmitting(true);

    const values: FieldValue[] = Object.entries(fieldValues)
      .filter(([_, value]) => value.trim())
      .map(([fieldId, value]) => ({
        fieldId,
        value: value.trim(),
      }));

    await onSubmit({
      demandTypeId: selectedTypeId,
      fieldValues: values,
    });

    // Limpar formulário
    setSelectedTypeId("");
    setFieldValues({});
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm px-5 py-6 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (demandTypes.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm px-5 py-6 text-center">
        <p className="text-gray-500 text-sm">
          Nenhum tipo de demanda configurado. Aguarde o administrador criar os
          tipos.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm px-5 py-5 space-y-4">
      {/* Seletor de tipo de demanda */}
      <div className="space-y-2">
        <Label
          htmlFor="demand-type"
          className="text-gray-700 text-sm font-medium"
        >
          Tipo de Demanda
        </Label>
        <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
          <SelectTrigger
            id="demand-type"
            className="rounded-xl border-gray-200 focus:ring-gray-300"
          >
            <SelectValue placeholder="Selecione o tipo de demanda" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {demandTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Campos dinâmicos */}
      {selectedType && selectedType.fields.length > 0 && (
        <div className="space-y-4 pt-3 border-t border-gray-100">
          {selectedType.fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label
                htmlFor={field.id}
                className="text-gray-700 text-sm font-medium"
              >
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>

              {field.field_type === "short_text" && (
                <Input
                  id={field.id}
                  value={fieldValues[field.id] || ""}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={`Digite ${field.label.toLowerCase()}`}
                  className="rounded-xl border-gray-200 focus:ring-gray-300"
                />
              )}

              {field.field_type === "long_text" && (
                <Textarea
                  id={field.id}
                  value={fieldValues[field.id] || ""}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={`Digite ${field.label.toLowerCase()}`}
                  rows={3}
                  className="rounded-xl border-gray-200 focus:ring-gray-300"
                />
              )}

              {field.field_type === "select" && field.options && (
                <Select
                  value={fieldValues[field.id] || ""}
                  onValueChange={(value) => handleFieldChange(field.id, value)}
                >
                  <SelectTrigger className="rounded-xl border-gray-200 focus:ring-gray-300">
                    <SelectValue
                      placeholder={`Selecione ${field.label.toLowerCase()}`}
                    />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {field.options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Botão de submissão */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSubmit}
          disabled={!validateForm() || isSubmitting}
          size="sm"
          className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white px-5"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Publicando...
            </>
          ) : (
            "Publicar"
          )}
        </Button>
      </div>
    </div>
  );
};

export default DemandInput;
