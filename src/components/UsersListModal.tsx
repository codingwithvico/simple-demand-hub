import { useState } from "react";
import { useUsers } from "@/hooks/useUsers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users, Loader2 } from "lucide-react";

export const UsersListModal = () => {
  const [open, setOpen] = useState(false);
  const { users, loading, refetch } = useUsers();

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      refetch();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Users className="h-4 w-4 mr-2" />
          Ver usuários cadastrados
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Usuários Cadastrados</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            Nenhum usuário cadastrado
          </p>
        ) : (
          <ul className="space-y-2">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded text-sm gap-2"
              >
                <div className="flex-1">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {user.email}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  {user.team_name && (
                    <span className="bg-muted px-2 py-1 rounded">
                      {user.team_name}
                    </span>
                  )}
                  <span className="text-muted-foreground">Convencional</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
};
