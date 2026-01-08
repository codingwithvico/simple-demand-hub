import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { UsersPanel } from "@/components/UsersPanel";
import { supabase } from "@/integrations/supabase/client";
import Sidebar, { AdminTab } from "@/components/Sidebar";
import { Loader2 } from "lucide-react";

const AdminUsers = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isMaster, loading: roleLoading } = useUserRole();

  const handleTabChange = (tab: AdminTab) => {
    if (tab === "demands") {
      navigate("/");
    } else if (tab === "demand-types") {
      navigate("/admin/demand-types");
    } else if (tab === "teams" || tab === "reports") {
      navigate("/");
    }
  };

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
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center justify-between px-4 z-10">
        <h1 className="text-foreground font-semibold text-lg">Tramita+</h1>
      </header>

      {/* Sidebar */}
      <Sidebar
        activeTab="users"
        onTabChange={handleTabChange}
        isMaster={isMaster}
        onLogout={() => supabase.auth.signOut()}
      />

      {/* Main content */}
      <main className="ml-56 pt-14">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">Usuários</h2>
            <p className="text-sm text-muted-foreground">
              Cadastro de usuários convencionais
            </p>
          </div>
          <UsersPanel />
        </div>
      </main>
    </div>
  );
};

export default AdminUsers;
