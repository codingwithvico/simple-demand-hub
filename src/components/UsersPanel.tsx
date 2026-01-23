import { useState, useEffect } from "react";
import { useUsers } from "@/hooks/useUsers";
import { useTeams } from "@/hooks/useTeams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { UsersListModal } from "./UsersListModal";

export const UsersPanel = () => {
  const { creating, createUser } = useUsers();
  const { teams, loading: teamsLoading, refetch: refetchTeams } = useTeams();
  const [teamsLoaded, setTeamsLoaded] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    team_id: "",
  });
  const [error, setError] = useState("");

  // Carrega equipes apenas quando o select é aberto pela primeira vez
  useEffect(() => {
    if (!teamsLoaded && teams.length === 0) {
      refetchTeams();
      setTeamsLoaded(true);
    }
  }, [teamsLoaded, teams.length, refetchTeams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (formData.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (!formData.team_id) {
      setError("Selecione uma equipe");
      return;
    }

    const success = await createUser({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      team_id: formData.team_id,
    });

    if (success) {
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        team_id: "",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Usuários
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                placeholder="Nome completo"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repita a senha"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="team">Equipe</Label>
              <Select
                value={formData.team_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, team_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma equipe" />
                </SelectTrigger>
                <SelectContent>
                  {teamsLoading ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Carregando...
                    </div>
                  ) : teams.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Nenhuma equipe disponível
                    </div>
                  ) : (
                    teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button type="submit" disabled={creating} className="w-full">
            {creating ? "Criando..." : "Criar Usuário"}
          </Button>
        </form>

        <div className="border-t pt-4">
          <UsersListModal />
        </div>
      </CardContent>
    </Card>
  );
};
