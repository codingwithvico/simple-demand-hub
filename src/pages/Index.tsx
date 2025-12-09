import { useState } from "react";
import DemandCard from "@/components/DemandCard";
import DemandInput from "@/components/DemandInput";
import { DemandStats } from "@/components/DemandStats";
import { TeamsPanel } from "@/components/TeamsPanel";
import { UsersPanel } from "@/components/UsersPanel";
import { AdminNav, AdminTab } from "@/components/AdminNav";
import { useAuth } from "@/hooks/useAuth";
import { useDemands } from "@/hooks/useDemands";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";

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
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-foreground font-semibold text-lg">Tramita+</h1>
        <Button variant="ghost" size="icon" onClick={signOut}>
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      <div className="max-w-2xl mx-auto min-h-[calc(100vh-52px)] px-4 py-4">
        {isMaster && <AdminNav activeTab={activeTab} onTabChange={setActiveTab} />}

        {/* Master: Demands tab or User view */}
        {(!isMaster || activeTab === "demands") && (
          <>
            <DemandInput onSubmit={handleSubmit} />
            <main className="pt-3">
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
            </main>
          </>
        )}

        {/* Master: Teams tab */}
        {isMaster && activeTab === "teams" && <TeamsPanel />}

        {/* Master: Users tab */}
        {isMaster && activeTab === "users" && <UsersPanel />}

        {/* Master: Reports tab */}
        {isMaster && activeTab === "reports" && <DemandStats />}
      </div>
    </div>
  );
};

export default Index;
