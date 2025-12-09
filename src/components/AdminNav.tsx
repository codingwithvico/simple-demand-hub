import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Building2, BarChart3 } from "lucide-react";

export type AdminTab = "demands" | "teams" | "users" | "reports";

interface AdminNavProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

export const AdminNav = ({ activeTab, onTabChange }: AdminNavProps) => {
  const tabs = [
    { id: "demands" as const, label: "Demandas", icon: LayoutDashboard },
    { id: "teams" as const, label: "Equipes", icon: Building2 },
    { id: "users" as const, label: "Usuários", icon: Users },
    { id: "reports" as const, label: "Relatórios", icon: BarChart3 },
  ];

  return (
    <nav className="flex gap-1 mb-6 border-b pb-2">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          variant={activeTab === tab.id ? "default" : "ghost"}
          size="sm"
          onClick={() => onTabChange(tab.id)}
          className="flex items-center gap-2"
        >
          <tab.icon className="h-4 w-4" />
          <span className="hidden sm:inline">{tab.label}</span>
        </Button>
      ))}
    </nav>
  );
};
