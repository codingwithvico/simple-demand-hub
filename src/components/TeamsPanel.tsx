import { useState } from "react";
import { useTeams } from "@/hooks/useTeams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Users } from "lucide-react";

export const TeamsPanel = () => {
  const { teams, loading, createTeam, deleteTeam } = useTeams();
  const [newTeamName, setNewTeamName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!newTeamName.trim()) return;
    setIsCreating(true);
    const success = await createTeam(newTeamName.trim());
    if (success) setNewTeamName("");
    setIsCreating(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Equipes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Nome da equipe"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <Button onClick={handleCreate} disabled={isCreating || !newTeamName.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm">Carregando...</p>
        ) : teams.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma equipe cadastrada</p>
        ) : (
          <ul className="space-y-2">
            {teams.map((team) => (
              <li
                key={team.id}
                className="flex items-center justify-between p-2 border rounded"
              >
                <span>{team.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteTeam(team.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
