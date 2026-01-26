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

  // Separa demandas por status: abertas (fila), em andamento e concluídas
  // Para usuários comuns, filtra apenas suas demandas, mas mantém posição correta na fila global
  const { openDemands, inProgressDemands, completedDemands, userOpenDemands, userInProgressDemands, userCompletedDemands } = useMemo(() => {
    const open = demands.filter((d) => d.status === "open");
    const inProgress = demands.filter((d) => d.status === "in_progress");
    const completed = demands.filter((d) => d.status === "completed");
    
    // Para usuários comuns, filtra apenas suas demandas
    const userId = profile?.id;
    const userOpen = open.filter((d) => d.created_by === userId);
    const userInProgress = inProgress.filter((d) => d.created_by === userId);
    const userCompleted = completed.filter((d) => d.created_by === userId);
    
    return {
      openDemands: open,
      inProgressDemands: inProgress,
      completedDemands: completed,
      userOpenDemands: userOpen,
      userInProgressDemands: userInProgress,
      userCompletedDemands: userCompleted,
    };
  }, [demands, profile?.id]);

  const handleSubmit = (data: {
    demandTypeId: string;
    fieldValues: { fieldId: string; value: string }[];
  }) => {
    createDemand(data);
  };

  return (
    <div className="min-h-screen bg-gray-100">
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
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <span>Demandas</span>
              <span>/</span>
              <span className="text-gray-600">
                {isMaster ? "Painel Administrativo" : "Minhas Demandas"}
              </span>
            </div>
            {/* Título e Subtítulo */}
            <h1 className="text-2xl font-semibold text-gray-900">
              {isMaster
                ? "Painel Administrativo"
                : profile?.name || "Minhas Demandas"}
            </h1>
            <p className="text-sm text-gray-500 mt-1 capitalize">
              {formatCurrentDate()}
            </p>
          </div>

          {/* DemandInput apenas para usuários não-admin */}
          {!isMaster && <DemandInput onSubmit={handleSubmit} />}
          <div className={`flex-1 min-h-0 ${!isMaster ? "pt-4" : ""}`}>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <KanbanBoard
                openDemands={isMaster ? openDemands : userOpenDemands}
                inProgressDemands={isMaster ? inProgressDemands : userInProgressDemands}
                completedDemands={isMaster ? completedDemands : userCompletedDemands}
                globalOpenDemands={isMaster ? undefined : openDemands}
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
    </div>
  );
};

export default Index;
