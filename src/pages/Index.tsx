import { useEffect, useMemo } from "react";
import KanbanBoard from "@/components/KanbanBoard";
import DemandInput from "@/components/DemandInput";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useDemands, requestNotificationPermission } from "@/hooks/useDemands";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserTeamSettings } from "@/hooks/useUserTeamSettings";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { signOut } = useAuth();
  const { isMaster } = useUserRole();
  const { notificationSoundEnabled } = useUserTeamSettings();
  const {
    demands,
    loading,
    claimingId,
    completingId,
    unclaimingId,
    createDemand,
    claimDemand,
    completeDemand,
    unclaimDemand,
    deleteDemand,
  } = useDemands(notificationSoundEnabled, isMaster);

  // Solicita permissão para notificações do navegador ao carregar
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Separa demandas pendentes (open + in_progress) e concluídas
  const { pendingDemands, completedDemands } = useMemo(() => {
    const pending = demands.filter((d) => d.status !== "completed");
    const completed = demands.filter((d) => d.status === "completed");
    return { pendingDemands: pending, completedDemands: completed };
  }, [demands]);

  const handleSubmit = (data: {
    demandTypeId: string;
    fieldValues: { fieldId: string; value: string }[];
  }) => {
    createDemand(data);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center justify-between px-4 z-10">
        <h1 className="text-foreground font-semibold text-lg">Tramita+</h1>
      </header>

      {/* Sidebar */}
      <Sidebar
        activeTab="demands"
        onLogout={() => supabase.auth.signOut()}
        isMaster={isMaster}
      />

      {/* Main content */}
      <main className="ml-56 pt-14 h-screen overflow-hidden">
        <div className="h-full px-6 py-4 flex flex-col">
          <DemandInput onSubmit={handleSubmit} />
          <div className="flex-1 pt-4 min-h-0">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <KanbanBoard
                pendingDemands={pendingDemands}
                completedDemands={completedDemands}
                onDelete={deleteDemand}
                onClaim={claimDemand}
                onComplete={completeDemand}
                onUnclaim={unclaimDemand}
                claimingId={claimingId}
                completingId={completingId}
                unclaimingId={unclaimingId}
                isMaster={isMaster}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
