import { useState } from "react";
import { useTeams } from "@/hooks/useTeams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users } from "lucide-react";
import { TeamsListModal } from "./TeamsListModal";

export const TeamsPanel = () => {
  const { createTeam } = useTeams();
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
          <Button
            onClick={handleCreate}
            disabled={isCreating || !newTeamName.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <TeamsListModal />
      </CardContent>
    </Card>
  );
};
