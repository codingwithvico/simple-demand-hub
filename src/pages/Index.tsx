import { useEffect, useMemo } from "react";
import KanbanBoard from "@/components/KanbanBoard";
import DemandInput from "@/components/DemandInput";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useDemands, requestNotificationPermission } from "@/hooks/useDemands";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserTeamSettings } from "@/hooks/useUserTeamSettings";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { isToday } from "date-fns";

// Formata a data atual
const formatCurrentDate = () => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  return now.toLocaleDateString("pt-BR", options);
};

const Index = () => {
  const { signOut } = useAuth();
  const { isMaster } = useUserRole();
  const { profile } = useUserProfile();
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

  // Calcula isDelayed e separa demandas por status
  const { openDemands, inProgressDemands, completedDemands } = useMemo(() => {
    // Adiciona isDelayed em cada demanda
    const demandsWithDelay = demands.map((d) => ({
      ...d,
      isDelayed: d.status !== "completed" && !isToday(d.created_at),
    }));

    // Separa por status
    const open = demandsWithDelay.filter((d) => d.status === "open");
    const inProgress = demandsWithDelay.filter((d) => d.status === "in_progress");
    const completed = demandsWithDelay.filter((d) => d.status === "completed");

    // Ordena: atrasadas primeiro (por created_at asc), depois do dia (por created_at asc)
    const sortByDelay = (a: typeof open[0], b: typeof open[0]) => {
      if (a.isDelayed && !b.isDelayed) return -1;
      if (!a.isDelayed && b.isDelayed) return 1;
      return a.created_at.getTime() - b.created_at.getTime();
    };

    return {
      openDemands: open.sort(sortByDelay),
      inProgressDemands: inProgress.sort(sortByDelay),
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
    <div className="min-h-screen bg-background transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar
        activeTab="demands"
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
              <span>Demandas</span>
              <span>/</span>
              <span className="text-foreground">
                {isMaster ? "Painel Administrativo" : "Minhas Demandas"}
              </span>
            </div>
            {/* Título e Subtítulo */}
            <h1 className="text-2xl font-semibold text-foreground">
              {isMaster
                ? "Painel Administrativo"
                : profile?.name || "Minhas Demandas"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 capitalize">
              {formatCurrentDate()}
            </p>
          </div>

          <div className="flex-1 min-h-0">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <KanbanBoard
                openDemands={openDemands}
                inProgressDemands={inProgressDemands}
                completedDemands={completedDemands}
                onDelete={deleteDemand}
                onClaim={isMaster ? claimDemand : undefined}
                onComplete={isMaster ? completeDemand : undefined}
                onUnclaim={isMaster ? unclaimDemand : undefined}
                claimingId={claimingId}
                completingId={completingId}
                unclaimingId={unclaimingId}
                isMaster={isMaster}
              />
            )}
          </div>
        </div>
      </main>

      {/* FAB + Compose panel para usuários não-admin */}
      {!isMaster && <DemandInput onSubmit={handleSubmit} />}
    </div>
  );
};

export default Index;
