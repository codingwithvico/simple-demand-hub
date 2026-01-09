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
  onSubmit: (data: {
    demandTypeId: string;
    fieldValues: FieldValue[];
  }) => void;
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
      <div className="mx-4 mt-4 border border-border rounded-lg px-4 py-6 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (demandTypes.length === 0) {
    return (
      <div className="mx-4 mt-4 border border-border rounded-lg px-4 py-6 text-center">
        <p className="text-muted-foreground text-sm">
          Nenhum tipo de demanda configurado. Aguarde o administrador criar os tipos.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-4 border border-border rounded-lg px-4 py-4 space-y-4">
      {/* Seletor de tipo de demanda */}
      <div className="space-y-2">
        <Label htmlFor="demand-type">Tipo de Demanda</Label>
        <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
          <SelectTrigger id="demand-type">
            <SelectValue placeholder="Selecione o tipo de demanda" />
          </SelectTrigger>
          <SelectContent>
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
        <div className="space-y-4 pt-2 border-t border-border">
          {selectedType.fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>
                {field.label}
                {field.required && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </Label>

              {field.field_type === "short_text" && (
                <Input
                  id={field.id}
                  value={fieldValues[field.id] || ""}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={`Digite ${field.label.toLowerCase()}`}
                />
              )}

              {field.field_type === "long_text" && (
                <Textarea
                  id={field.id}
                  value={fieldValues[field.id] || ""}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={`Digite ${field.label.toLowerCase()}`}
                  rows={3}
                />
              )}

              {field.field_type === "select" && field.options && (
                <Select
                  value={fieldValues[field.id] || ""}
                  onValueChange={(value) => handleFieldChange(field.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Selecione ${field.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
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
