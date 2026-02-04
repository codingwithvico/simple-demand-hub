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
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

export type AdminTab =
  | "demands"
  | "teams"
  | "users"
  | "reports"
  | "demand-types";

interface SidebarProps {
  activeTab: AdminTab;
  onLogout: () => void;
  isMaster: boolean;
}

const Sidebar = ({ activeTab, onLogout, isMaster }: SidebarProps) => {
  const navigate = useNavigate();

  const tabs = [
    {
      id: "demands" as const,
      label: "Demandas",
      icon: LayoutDashboard,
      masterOnly: false,
      route: "/",
    },
    {
      id: "teams" as const,
      label: "Equipes",
      icon: Building2,
      masterOnly: true,
      route: "/admin/teams",
    },
    {
      id: "users" as const,
      label: "Usuários",
      icon: Users,
      masterOnly: true,
      route: "/admin/users",
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
      route: "/admin/reports",
    },
  ];

  const visibleTabs = tabs.filter((tab) => !tab.masterOnly || isMaster);

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-sidebar flex flex-col border-r border-sidebar-border transition-colors duration-200">
      {/* Logo */}
      <div className="px-5 py-6">
        <Logo size="md" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-0.5">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => navigate(tab.route)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
              activeTab === tab.id
                ? "bg-card text-foreground font-medium shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <tab.icon className="h-4 w-4" strokeWidth={1.5} />
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 space-y-2">
        <div className="flex items-center justify-between px-3">
          <span className="text-xs text-muted-foreground">Tema</span>
          <ThemeToggle />
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-all"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.5} />
          Sair
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
