import { LayoutDashboard, Users, Building2, BarChart3, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AdminTab = "demands" | "teams" | "users" | "reports";

interface SidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onSignOut: () => void;
  isMaster: boolean;
}

export const Sidebar = ({ activeTab, onTabChange, onSignOut, isMaster }: SidebarProps) => {
  const tabs = [
    { id: "demands" as const, label: "Demandas", icon: LayoutDashboard, masterOnly: false },
    { id: "teams" as const, label: "Equipes", icon: Building2, masterOnly: true },
    { id: "users" as const, label: "Usuários", icon: Users, masterOnly: true },
    { id: "reports" as const, label: "Relatórios", icon: BarChart3, masterOnly: true },
  ];

  const visibleTabs = tabs.filter(tab => !tab.masterOnly || isMaster);

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-card border-r border-border flex flex-col">
      {/* Logo / Brand */}
      <div className="h-14 flex items-center px-4 border-b border-border">
        <h1 className="text-foreground font-semibold text-lg">Tramita+</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSignOut}
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
  );
};
