import {
  LayoutDashboard,
  Users,
  Building2,
  BarChart3,
  LogOut,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export type AdminTab =
  | "demands"
  | "teams"
  | "users"
  | "reports"
  | "demand-types";

interface SidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onLogout: () => void;
  isMaster: boolean;
}

const Sidebar = ({
  activeTab,
  onTabChange,
  onLogout,
  isMaster,
}: SidebarProps) => {
  const navigate = useNavigate();

  const tabs = [
    {
      id: "demands" as const,
      label: "Demandas",
      icon: LayoutDashboard,
      masterOnly: false,
      route: null,
    },
    {
      id: "teams" as const,
      label: "Equipes",
      icon: Building2,
      masterOnly: true,
      route: null,
    },
    {
      id: "users" as const,
      label: "Usuários",
      icon: Users,
      masterOnly: true,
      route: null,
    },
    {
      id: "demand-types" as const,
      label: "Tipos de Demanda",
      icon: FileText,
      masterOnly: true,
      route: "/admin/demand-types",
    },
    {
      id: "reports" as const,
      label: "Relatórios",
      icon: BarChart3,
      masterOnly: true,
      route: null,
    },
  ];

  const visibleTabs = tabs.filter((tab) => !tab.masterOnly || isMaster);

  return (
    <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-56 bg-card border-r border-border flex flex-col">
      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.route) {
                navigate(tab.route);
              } else {
                onTabChange(tab.id);
              }
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
          onClick={onLogout}
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
