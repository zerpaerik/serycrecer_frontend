"use client";

import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo, LogoMark } from "@/components/brand/logo";
import { SidebarNav } from "./sidebar-nav";
import { Button } from "@/components/ui/button";

export function AppSidebar({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r bg-sidebar transition-[width] duration-300 ease-in-out lg:flex",
        collapsed ? "w-[4.75rem]" : "w-64",
      )}
    >
      {/* Marca */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-sidebar-border px-4",
          collapsed && "justify-center px-0",
        )}
      >
        <Link href="/dashboard" className="flex items-center">
          {collapsed ? <LogoMark className="h-8 w-8" /> : <Logo />}
        </Link>
      </div>

      {/* Navegación */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <SidebarNav collapsed={collapsed} />
      </div>

      {/* Pie / contraer */}
      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          onClick={onToggleCollapse}
          className={cn(
            "w-full text-muted-foreground hover:text-foreground",
            collapsed ? "justify-center px-0" : "justify-start",
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-[18px]" />
          ) : (
            <>
              <PanelLeftClose className="size-[18px]" />
              <span>Contraer</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
