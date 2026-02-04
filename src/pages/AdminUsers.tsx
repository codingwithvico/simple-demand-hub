import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { UsersPanel } from "@/components/UsersPanel";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import { Loader2 } from "lucide-react";

const AdminUsers = () => {
  const { user, loading: authLoading } = useAuth();
  const { isMaster, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isMaster) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        activeTab="users"
        onLogout={() => supabase.auth.signOut()}
        isMaster={isMaster}
      />

      {/* Main content */}
      <main className="ml-56 h-screen overflow-hidden">
        <div className="h-full px-6 py-5 flex flex-col">
          {/* Page Header com Breadcrumb */}
          <div className="mb-5">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span>Administração</span>
              <span>/</span>
              <span className="text-foreground">Usuários</span>
            </div>
            {/* Título e Subtítulo */}
            <h1 className="text-2xl font-semibold text-foreground">Usuários</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Cadastro de usuários convencionais
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-auto">
            <UsersPanel />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminUsers;
