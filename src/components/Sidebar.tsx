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
    <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-56 bg-white border-r border-gray-100 flex flex-col">
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => navigate(tab.route)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700",
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="w-full justify-start gap-3 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
