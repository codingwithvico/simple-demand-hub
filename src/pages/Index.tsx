import { useEffect } from "react";
import DemandCard from "@/components/DemandCard";
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
      <main className="ml-56 pt-14">
        <div className="max-w-2xl mx-auto min-h-screen px-6 py-6">
          <DemandInput onSubmit={handleSubmit} />
          <div className="pt-3">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : demands.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground">
                Nenhuma demanda ainda. Adicione a primeira!
              </div>
            ) : (
              demands.map((demand) => (
                <DemandCard
                  key={demand.id}
                  demand={demand}
                  onDelete={deleteDemand}
                  onClaim={claimDemand}
                  onComplete={completeDemand}
                  onUnclaim={unclaimDemand}
                  isClaiming={claimingId === demand.id}
                  isCompleting={completingId === demand.id}
                  isUnclaiming={unclaimingId === demand.id}
                  isMaster={isMaster}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
