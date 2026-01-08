import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, ChevronUp, ChevronDown, X } from "lucide-react";
import Sidebar, { AdminTab } from "@/components/Sidebar";

type FieldType = "short_text" | "long_text" | "select";

interface LayoutField {
  id: string;
  label: string;
  field_type: FieldType;
  required: boolean;
  options: string[];
}

interface DemandType {
  id: string;
  name: string;
  created_at: string;
}

const DemandTypes = () => {
  const { user, loading: authLoading } = useAuth();
  const { isMaster, loading: roleLoading, role } = useUserRole();
  const navigate = useNavigate();

  const [demandTypes, setDemandTypes] = useState<DemandType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [typeName, setTypeName] = useState("");
  const [fields, setFields] = useState<LayoutField[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setSaving] = useState(false);

  const handleTabChange = (tab: AdminTab) => {
    if (tab === "demands") {
      navigate("/");
    } else if (tab === "users") {
      navigate("/admin/users");
    }
    // As outras abas (teams, reports) são gerenciadas pelo Index
    // então navegamos para "/" e deixamos o Index lidar com elas
    else if (tab === "teams" || tab === "reports") {
      navigate("/");
    }
  };

  // Carregar tipos existentes
  useEffect(() => {
    if (user && isMaster) {
      fetchDemandTypes();
    }
  }, [user, isMaster]);

  // Carregar campos quando selecionar um tipo
  useEffect(() => {
    if (selectedTypeId) {
      fetchFields(selectedTypeId);
    } else {
      setFields([]);
    }
  }, [selectedTypeId]);

  const fetchDemandTypes = async () => {
    const { data, error } = await supabase
      .from("demand_types")
      .select("id, name, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar tipos de demanda");
      return;
    }
    setDemandTypes(data || []);
  };

  const fetchFields = async (typeId: string) => {
    const { data, error } = await supabase
      .from("demand_type_fields")
      .select("*")
      .eq("demand_type_id", typeId)
      .order("sort_order", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar campos");
      return;
    }

    setFields(
      (data || []).map((f) => ({
        id: f.id,
        label: f.label,
        field_type: f.field_type as FieldType,
        required: f.required,
        options: (f.options as string[]) || [],
      })),
    );
  };

  const handleCreateType = async () => {
    const trimmedName = typeName.trim();
    if (!trimmedName) {
      toast.error("Nome é obrigatório");
      return;
    }

    // Verificar nome único
    const exists = demandTypes.some(
      (t) => t.name.toLowerCase() === trimmedName.toLowerCase(),
    );
    if (exists) {
      toast.error("Já existe um tipo com esse nome");
      return;
    }

    setIsCreating(true);
    const { data, error } = await supabase
      .from("demand_types")
      .insert({ name: trimmedName, created_by: user!.id })
      .select()
      .single();

    setIsCreating(false);

    if (error) {
      toast.error("Erro ao criar tipo de demanda");
      return;
    }

    toast.success("Tipo de demanda criado");
    setTypeName("");
    setDemandTypes((prev) => [data, ...prev]);
    setSelectedTypeId(data.id);
    setFields([]);
  };

  const handleAddField = () => {
    const newField: LayoutField = {
      id: crypto.randomUUID(),
      label: "",
      field_type: "short_text",
      required: false,
      options: [],
    };
    setFields((prev) => [...prev, newField]);
  };

  const handleUpdateField = (
    id: string,
    key: keyof LayoutField,
    value: unknown,
  ) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [key]: value } : f)),
    );
  };

  const handleRemoveField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const handleMoveField = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;

    const newFields = [...fields];
    [newFields[index], newFields[newIndex]] = [
      newFields[newIndex],
      newFields[index],
    ];
    setFields(newFields);
  };

  const handleAddOption = (fieldId: string, option: string) => {
    const trimmed = option.trim();
    if (!trimmed) return;

    setFields((prev) =>
      prev.map((f) =>
        f.id === fieldId ? { ...f, options: [...f.options, trimmed] } : f,
      ),
    );
  };

  const handleRemoveOption = (fieldId: string, optionIndex: number) => {
    setFields((prev) =>
      prev.map((f) =>
        f.id === fieldId
          ? { ...f, options: f.options.filter((_, i) => i !== optionIndex) }
          : f,
      ),
    );
  };

  const handleSaveLayout = async () => {
    if (!selectedTypeId) return;

    // Validações
    if (fields.length === 0) {
      toast.error("Adicione pelo menos 1 campo");
      return;
    }

    const invalidField = fields.find((f) => !f.label.trim());
    if (invalidField) {
      toast.error("Todos os campos precisam ter um label");
      return;
    }

    const selectWithoutOptions = fields.find(
      (f) => f.field_type === "select" && f.options.length === 0,
    );
    if (selectWithoutOptions) {
      toast.error("Campos de lista suspensa precisam ter opções");
      return;
    }

    setSaving(true);

    // Deletar campos existentes
    await supabase
      .from("demand_type_fields")
      .delete()
      .eq("demand_type_id", selectedTypeId);

    // Inserir novos campos
    const fieldsToInsert = fields.map((f, index) => ({
      demand_type_id: selectedTypeId,
      label: f.label.trim(),
      field_type: f.field_type,
      required: f.required,
      options: f.field_type === "select" ? f.options : null,
      sort_order: index,
    }));

    const { error } = await supabase
      .from("demand_type_fields")
      .insert(fieldsToInsert);

    setSaving(false);

    if (error) {
      toast.error("Erro ao salvar layout");
      return;
    }

    toast.success("Layout salvo com sucesso");
  };

  const handleDeleteType = async (typeId: string) => {
    const { error } = await supabase
      .from("demand_types")
      .delete()
      .eq("id", typeId);

    if (error) {
      toast.error("Erro ao excluir tipo");
      return;
    }

    toast.success("Tipo excluído");
    setDemandTypes((prev) => prev.filter((t) => t.id !== typeId));
    if (selectedTypeId === typeId) {
      setSelectedTypeId(null);
      setFields([]);
    }
  };

  // Loading
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando permissões...</p>
          <p className="text-xs text-muted-foreground mt-2">
            authLoading: {authLoading.toString()}, roleLoading:{" "}
            {roleLoading.toString()}
          </p>
        </div>
      </div>
    );
  }

  // Não autenticado
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Não é master - redirecionar para demandas
  if (!isMaster) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center justify-between px-4 z-10">
        <h1 className="text-foreground font-semibold text-lg">Tramita+</h1>
      </header>

      {/* Sidebar */}
      <Sidebar
        activeTab="demand-types"
        onTabChange={handleTabChange}
        isMaster={isMaster}
        onLogout={() => supabase.auth.signOut()}
      />

      {/* Main content */}
      <main className="ml-56 pt-14">
        <div className="max-w-4xl mx-auto px-6 py-6">
          {/* Cabeçalho */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              Tipos de Demanda
            </h2>
            <p className="text-sm text-muted-foreground">
              Defina os layouts das demandas
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna esquerda - Lista e criação */}
            <div className="space-y-4">
              {/* Criar novo tipo */}
              <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                <Label htmlFor="typeName">Nome do Tipo de Demanda</Label>
                <Input
                  id="typeName"
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  placeholder="Ex: Solicitação de Material"
                />
                <Button
                  onClick={handleCreateType}
                  disabled={isCreating}
                  className="w-full"
                >
                  {isCreating ? "Criando..." : "Criar Tipo de Demanda"}
                </Button>
              </div>

              {/* Lista de tipos */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="text-sm font-medium text-foreground mb-3">
                  Tipos Existentes
                </h3>
                {demandTypes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum tipo criado
                  </p>
                ) : (
                  <div className="space-y-2">
                    {demandTypes.map((type) => (
                      <div
                        key={type.id}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                          selectedTypeId === type.id
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => setSelectedTypeId(type.id)}
                      >
                        <span className="text-sm text-foreground truncate">
                          {type.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteType(type.id);
                          }}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Coluna direita - Layout dos campos */}
            <div className="lg:col-span-2">
              {selectedTypeId ? (
                <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground">
                      Layout da Demanda
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddField}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar Campo
                    </Button>
                  </div>

                  {fields.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Nenhum campo adicionado. Clique em "Adicionar Campo" para
                      começar.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <FieldEditor
                          key={field.id}
                          field={field}
                          index={index}
                          totalFields={fields.length}
                          onUpdate={handleUpdateField}
                          onRemove={handleRemoveField}
                          onMove={handleMoveField}
                          onAddOption={handleAddOption}
                          onRemoveOption={handleRemoveOption}
                        />
                      ))}
                    </div>
                  )}

                  <div className="pt-4 border-t border-border">
                    <Button
                      onClick={handleSaveLayout}
                      disabled={isSaving || fields.length === 0}
                      className="w-full"
                    >
                      {isSaving ? "Salvando..." : "Salvar Layout"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-lg p-8 text-center">
                  <p className="text-muted-foreground">
                    Selecione ou crie um tipo de demanda para editar o layout
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Componente para editar um campo
interface FieldEditorProps {
  field: LayoutField;
  index: number;
  totalFields: number;
  onUpdate: (id: string, key: keyof LayoutField, value: unknown) => void;
  onRemove: (id: string) => void;
  onMove: (index: number, direction: "up" | "down") => void;
  onAddOption: (fieldId: string, option: string) => void;
  onRemoveOption: (fieldId: string, optionIndex: number) => void;
}

const FieldEditor = ({
  field,
  index,
  totalFields,
  onUpdate,
  onRemove,
  onMove,
  onAddOption,
  onRemoveOption,
}: FieldEditorProps) => {
  const [newOption, setNewOption] = useState("");

  const handleAddOption = () => {
    if (newOption.trim()) {
      onAddOption(field.id, newOption);
      setNewOption("");
    }
  };

  return (
    <div className="border border-border rounded-lg p-4 space-y-3 bg-background">
      <div className="flex items-start gap-3">
        {/* Ordenação */}
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={index === 0}
            onClick={() => onMove(index, "up")}
            className="h-6 w-6 p-0"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={index === totalFields - 1}
            onClick={() => onMove(index, "down")}
            className="h-6 w-6 p-0"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Campos */}
        <div className="flex-1 space-y-3">
          {/* Label */}
          <div>
            <Label className="text-xs">Label do campo</Label>
            <Input
              value={field.label}
              onChange={(e) => onUpdate(field.id, "label", e.target.value)}
              placeholder="Ex: Descrição do problema"
              className="mt-1"
            />
          </div>

          {/* Tipo e Obrigatório */}
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label className="text-xs">Tipo do campo</Label>
              <Select
                value={field.field_type}
                onValueChange={(v) => onUpdate(field.id, "field_type", v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short_text">Texto curto</SelectItem>
                  <SelectItem value="long_text">Texto longo</SelectItem>
                  <SelectItem value="select">Lista suspensa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                id={`required-${field.id}`}
                checked={field.required}
                onCheckedChange={(checked) =>
                  onUpdate(field.id, "required", checked)
                }
              />
              <Label htmlFor={`required-${field.id}`} className="text-xs">
                Obrigatório
              </Label>
            </div>
          </div>

          {/* Opções (apenas para select) */}
          {field.field_type === "select" && (
            <div className="space-y-2">
              <Label className="text-xs">Opções</Label>
              <div className="flex gap-2">
                <Input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="Nova opção"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddOption}
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {field.options.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {field.options.map((opt, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm"
                    >
                      {opt}
                      <button
                        type="button"
                        onClick={() => onRemoveOption(field.id, i)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Remover */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(field.id)}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default DemandTypes;
