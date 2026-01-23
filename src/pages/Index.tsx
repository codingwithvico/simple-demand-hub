import { useEffect, useMemo } from "react";
import KanbanBoard from "@/components/KanbanBoard";
import UserDemandsList from "@/components/UserDemandsList";
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

  // Separa demandas por status: abertas (fila), em andamento e concluídas
  const { openDemands, inProgressDemands, completedDemands } = useMemo(() => {
    const open = demands.filter((d) => d.status === "open");
    const inProgress = demands.filter((d) => d.status === "in_progress");
    const completed = demands.filter((d) => d.status === "completed");
    return {
      openDemands: open,
      inProgressDemands: inProgress,
      completedDemands: completed,
    };
  }, [demands]);

  const handleSubmit = (data: {
    demandTypeId: string;
    fieldValues: { fieldId: string; value: string }[];
  }) => {
    createDemand(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-10">
        <h1 className="text-gray-900 font-semibold text-lg">Tramita+</h1>
      </header>

      {/* Sidebar */}
      <Sidebar
        activeTab="demands"
        onLogout={() => supabase.auth.signOut()}
        isMaster={isMaster}
      />

      {/* Main content */}
      <main className="ml-56 pt-14 h-screen overflow-hidden">
        <div className="h-full px-6 py-5 flex flex-col">
          <DemandInput onSubmit={handleSubmit} />
          <div className="flex-1 pt-4 min-h-0">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : isMaster ? (
              <KanbanBoard
                openDemands={openDemands}
                inProgressDemands={inProgressDemands}
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
            ) : (
              <UserDemandsList demands={demands} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
