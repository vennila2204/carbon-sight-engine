import { Link, useNavigate } from "@tanstack/react-router";
import { Factory, LogOut, Menu, PanelLeftClose, PanelLeftOpen, UserCog, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { INDUSTRY_LIST } from "@/lib/industries";
import type { IndustryKey } from "@/lib/types";

export function Header({
  onToggleSidebar,
  onOpenDrawer,
  collapsed,
}: {
  onToggleSidebar: () => void;
  onOpenDrawer: () => void;
  collapsed: boolean;
}) {
  const { user, logout, loginAs } = useAuth();
  const { industry, setIndustry } = useApp();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-card/90 px-3 backdrop-blur md:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenDrawer} aria-label="Open menu">
        <Menu className="size-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:inline-flex"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
      >
        {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
      </Button>

      <Link to="/dashboard" className="mr-auto flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Zap className="size-4" />
        </span>
        <span className="hidden text-sm font-semibold leading-tight sm:block">
          Carbon Intelligence
          <span className="block text-[11px] font-normal text-muted-foreground">
            & Reduction Engine
          </span>
        </span>
      </Link>

      <Select value={industry} onValueChange={(v) => setIndustry(v as IndustryKey)}>
        <SelectTrigger className="w-[150px] md:w-[210px]" aria-label="Select industry">
          <Factory className="mr-1 size-4 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {INDUSTRY_LIST.map((i) => (
            <SelectItem key={i.key} value={i.key}>
              {i.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        className="hidden shrink-0 sm:inline-flex"
        onClick={() => {
          const next = user?.role === "ADMIN" ? "USER" : "ADMIN";
          loginAs(next);
          if (next === "USER") navigate({ to: "/dashboard" });
        }}
      >
        <UserCog className="mr-1.5 size-4" />
        Switch to {user?.role === "ADMIN" ? "User" : "Admin"}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-2">
            <span className="grid size-8 place-items-center rounded-full bg-secondary text-xs font-semibold">
              {user?.name?.slice(0, 2).toUpperCase()}
            </span>
            <span className="hidden text-left text-xs leading-tight md:block">
              {user?.name}
              <Badge variant="secondary" className="ml-1 px-1 py-0 text-[10px]">
                {user?.role}
              </Badge>
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            {user?.email}
            <span className="block">{user?.facility}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => loginAs("USER")}>Sign in as USER</DropdownMenuItem>
          <DropdownMenuItem onClick={() => loginAs("ADMIN")}>Sign in as ADMIN</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              logout();
              navigate({ to: "/" });
            }}
          >
            <LogOut className="mr-2 size-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
