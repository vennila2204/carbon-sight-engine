import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Database,
  FileBarChart,
  Gauge,
  LayoutDashboard,
  Leaf,
  RefreshCcw,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Target,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

export interface NavItem {
  to: string;
  label: string;
  icon: typeof Leaf;
  admin?: boolean;
}

export const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Intelligence",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/data", label: "Factory Data", icon: Database },
      { to: "/analysis", label: "Carbon Analysis", icon: Activity },
    ],
  },
  {
    title: "Reduction",
    items: [
      { to: "/actions", label: "Reduction Actions", icon: Leaf },
      { to: "/optimize", label: "Optimisation Engine", icon: Target },
      { to: "/simulator", label: "What-If Simulator", icon: SlidersHorizontal },
      { to: "/reoptimize", label: "Dynamic Re-Optimisation", icon: RefreshCcw },
      { to: "/reports", label: "Auditable Reports", icon: FileBarChart },
    ],
  },
  {
    title: "Administration",
    items: [
      { to: "/admin/datasets", label: "Dataset Management", icon: ShieldCheck, admin: true },
      { to: "/admin/system", label: "System & Audit Log", icon: Settings, admin: true },
    ],
  },
];

export function SidebarNav({
  role,
  collapsed,
  onNavigate,
}: {
  role: Role;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex flex-col gap-6 px-3 py-4">
      {NAV_GROUPS.map((group) => {
        const items = group.items.filter((i) => !i.admin || role === "ADMIN");
        if (!items.length) return null;
        return (
          <div key={group.title}>
            {!collapsed && (
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {group.title}
              </p>
            )}
            <ul className="space-y-1">
              {items.map((item) => {
                const active = pathname === item.to;
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        collapsed && "justify-center px-0",
                      )}
                    >
                      <Icon className="size-[18px] shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
      {!collapsed && (
        <div className="mt-auto rounded-xl border border-sidebar-border bg-sidebar-accent/60 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-sidebar-foreground">
            <Gauge className="size-4 text-primary" /> Solver status
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            OR-Tools CP-SAT ready · last run 2.4s
          </p>
        </div>
      )}
    </nav>
  );
}
