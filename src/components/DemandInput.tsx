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
import { useDemandTypes } from "@/hooks/useDemandTypes";
import {
  useMatriculaCheck,
  normalizeMatricula,
  findMatriculaDuplicate,
} from "@/hooks/useMatriculaCheck";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, X, AlertTriangle } from "lucide-react";

const isMatriculaLabel = (label: string) =>
  label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase() === "matricula";


interface FieldValue {
  fieldId: string;
  value: string;
}

interface DemandInputProps {
  onSubmit: (data: { demandTypeId: string; fieldValues: FieldValue[] }) => void;
}

const DemandInput = ({ onSubmit }: DemandInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { demandTypes, loading } = useDemandTypes();
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedType = demandTypes.find((t) => t.id === selectedTypeId);

  // Todos os ids de campos "MATRÍCULA" (de qualquer tipo de demanda)
  const matriculaFieldIds = useMemo(
    () =>
      demandTypes.flatMap((t) =>
        t.fields.filter((f) => isMatriculaLabel(f.label)).map((f) => f.id),
      ),
    [demandTypes],
  );

  const matriculaField = selectedType?.fields.find((f) =>
    isMatriculaLabel(f.label),
  );
  const matriculaValue = matriculaField
    ? fieldValues[matriculaField.id] || ""
    : "";

  const { checking: checkingMatricula, duplicate: matriculaDuplicate } =
    useMatriculaCheck(matriculaValue, matriculaFieldIds);

  useEffect(() => {
    setFieldValues({});
  }, [selectedTypeId]);

  const handleFieldChange = (fieldId: string, value: string, label?: string) => {
    const next = label && isMatriculaLabel(label) ? normalizeMatricula(value) : value;
    setFieldValues((prev) => ({ ...prev, [fieldId]: next }));
  };

  const validateForm = (): boolean => {
    if (!selectedType) return false;
    for (const field of selectedType.fields) {
      if (field.required) {
        const value = fieldValues[field.id]?.trim();
        if (!value) return false;
      }
    }
    if (matriculaDuplicate || checkingMatricula) return false;
    return true;
  };

  const resetForm = () => {
    setSelectedTypeId("");
    setFieldValues({});
  };

  const handleSubmit = async () => {
    if (!validateForm() || !selectedTypeId) return;
    setIsSubmitting(true);

    // Revalidação final da matrícula (evita corrida entre operadores)
    if (matriculaValue) {
      const dup = await findMatriculaDuplicate(matriculaValue, matriculaFieldIds);
      if (dup) {
        toast({
          title: "Matrícula já solicitada",
          description: `Aberta por ${dup.createdByName} em ${dup.formatted}.`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
    }

    const values: FieldValue[] = Object.entries(fieldValues)
      .filter(([_, value]) => value.trim())
      .map(([fieldId, value]) => ({ fieldId, value: value.trim() }));

    await onSubmit({ demandTypeId: selectedTypeId, fieldValues: values });

    resetForm();
    setIsSubmitting(false);
    setIsOpen(false);
  };


  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  // FAB button
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        aria-label="Nova Demanda"
      >
        <Plus className="h-6 w-6" />
      </button>
    );
  }

  // Compose panel
  return (
    <div className="fixed bottom-6 right-6 z-50 w-[420px] max-h-[80vh] bg-card border border-border rounded-xl shadow-2xl flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary rounded-t-xl">
        <h3 className="text-sm font-semibold text-primary-foreground">Nova Demanda</h3>
        <button
          onClick={handleClose}
          className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : demandTypes.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            Nenhum tipo de demanda configurado.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="demand-type" className="text-foreground text-sm font-medium">
                Tipo de Demanda
              </Label>
              <Select key={demandTypes.length} value={selectedTypeId} onValueChange={setSelectedTypeId}>
                <SelectTrigger id="demand-type" className="rounded-xl border-border focus:ring-ring">
                  <SelectValue placeholder="Selecione o tipo de demanda" />
                </SelectTrigger>
                <SelectContent className="rounded-xl notranslate" position="popper" sideOffset={4} translate="no">
                  {demandTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <span translate="no">{type.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedType && selectedType.fields.length > 0 && (
              <div className="space-y-4 pt-3 border-t border-border">
                {selectedType.fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id} className="text-foreground text-sm font-medium">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>

                    {field.field_type === "short_text" && (
                      <Input
                        id={field.id}
                        value={fieldValues[field.id] || ""}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        placeholder={`Digite ${field.label.toLowerCase()}`}
                        className="rounded-xl border-border focus:ring-ring"
                      />
                    )}

                    {field.field_type === "long_text" && (
                      <Textarea
                        id={field.id}
                        value={fieldValues[field.id] || ""}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        placeholder={`Digite ${field.label.toLowerCase()}`}
                        rows={3}
                        className="rounded-xl border-border focus:ring-ring"
                      />
                    )}

                    {field.field_type === "select" && field.options && (
                      <Select
                        key={`${field.id}-${field.options.length}`}
                        value={fieldValues[field.id] || ""}
                        onValueChange={(value) => handleFieldChange(field.id, value)}
                      >
                        <SelectTrigger className="rounded-xl border-border focus:ring-ring">
                          <SelectValue placeholder={`Selecione ${field.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl notranslate" position="popper" sideOffset={4} translate="no">
                          {field.options.map((option) => (
                            <SelectItem key={option} value={option}>
                              <span translate="no">{option}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSubmit}
                disabled={!validateForm() || isSubmitting}
                size="sm"
                className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-5"
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
          </>
        )}
      </div>
    </div>
  );
};

export default DemandInput;
