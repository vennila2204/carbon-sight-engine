import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Zap } from "lucide-react";

import { Header } from "./Header";
import { SidebarNav } from "./Sidebar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export function AppLayout({ adminOnly, children }: { adminOnly?: boolean; children: ReactNode }) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) navigate({ to: "/", replace: true });
    else if (adminOnly && user.role !== "ADMIN") navigate({ to: "/dashboard", replace: true });
  }, [ready, user, adminOnly, navigate]);

  if (!ready || !user || (adminOnly && user.role !== "ADMIN")) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Zap className="size-4 animate-pulse text-primary" /> Loading workspace…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        collapsed={collapsed}
        onToggleSidebar={() => setCollapsed((c) => !c)}
        onOpenDrawer={() => setDrawer(true)}
      />
      <div className="flex">
        <aside
          className={cn(
            "sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 overflow-y-auto border-r border-sidebar-border bg-sidebar transition-[width] lg:block",
            collapsed ? "w-[76px]" : "w-64",
          )}
        >
          <SidebarNav role={user.role} collapsed={collapsed} />
        </aside>

        <Sheet open={drawer} onOpenChange={setDrawer}>
          <SheetContent side="left" className="w-[280px] bg-sidebar p-0">
            <SheetHeader className="border-b border-sidebar-border px-4 py-4">
              <SheetTitle className="text-sm">Navigation</SheetTitle>
            </SheetHeader>
            <SidebarNav role={user.role} collapsed={false} onNavigate={() => setDrawer(false)} />
          </SheetContent>
        </Sheet>

        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
