import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { UsersPanel } from "@/components/UsersPanel";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

const AdminUsers = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isMaster, loading: roleLoading } = useUserRole();

  const isLoading = authLoading || roleLoading;

  // Redirect non-masters to home
  useEffect(() => {
    if (!isLoading && user && !isMaster) {
      navigate("/", { replace: true });
    }
  }, [isLoading, user, isMaster, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Don't render until we confirm user is master
  if (!isMaster) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-foreground font-semibold text-lg">Usuários</h1>
          <p className="text-muted-foreground text-sm">Cadastro de usuários convencionais</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <UsersPanel />
      </div>
    </div>
  );
};

export default AdminUsers;
