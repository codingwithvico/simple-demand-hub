import { useState } from "react";
import DemandCard from "@/components/DemandCard";
import DemandInput from "@/components/DemandInput";
import { DemandStats } from "@/components/DemandStats";
import { TeamsPanel } from "@/components/TeamsPanel";
import { UsersPanel } from "@/components/UsersPanel";
import { Sidebar, AdminTab } from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useDemands } from "@/hooks/useDemands";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { signOut } = useAuth();
  const { isMaster } = useUserRole();
  const [activeTab, setActiveTab] = useState<AdminTab>("demands");
  const {
    demands,
    loading,
    claimingId,
    completingId,
    createDemand,
    claimDemand,
    completeDemand,
    deleteDemand,
  } = useDemands();

  const handleSubmit = (text: string) => {
    createDemand(text);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center justify-between px-4 z-10">
        <h1 className="text-foreground font-semibold text-lg">Tramita+</h1>
      </header>

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSignOut={signOut}
        isMaster={isMaster}
      />

      {/* Main content */}
      <main className="ml-56 pt-14">
        <div className="max-w-2xl mx-auto min-h-screen px-6 py-6">
          {/* Demands tab */}
          {activeTab === "demands" && (
            <>
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
                      isClaiming={claimingId === demand.id}
                      isCompleting={completingId === demand.id}
                      isMaster={isMaster}
                    />
                  ))
                )}
              </div>
            </>
          )}

          {/* Teams tab */}
          {isMaster && activeTab === "teams" && <TeamsPanel />}

          {/* Users tab */}
          {isMaster && activeTab === "users" && <UsersPanel />}

          {/* Reports tab */}
          {isMaster && activeTab === "reports" && <DemandStats />}
        </div>
      </main>
    </div>
  );
};

export default Index;
