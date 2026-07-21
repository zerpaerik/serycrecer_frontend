"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "./user-menu";
import { findNavItem, groupLabelForHref } from "@/lib/nav";

/** Notificaciones simuladas para la demo. */
const NOTIFICATIONS = [
  { title: "Cita confirmada", desc: "Lucía Vega · hoy 4:00 p. m.", time: "hace 6 min", color: "#0d9488" },
  { title: "Pago registrado", desc: "Sesión — Diego Ramos · S/ 80.00", time: "hace 40 min", color: "#0ea5e9" },
  { title: "Paciente no asistió", desc: "Turno mañana — reprogramar", time: "hace 2 h", color: "#f59e0b" },
];

function PageTitle() {
  const pathname = usePathname();
  const item = findNavItem(pathname);
  const group = groupLabelForHref(pathname);
  const title = item?.label ?? "Ser y Crecer";

  return (
    <div className="min-w-0">
      {group && (
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {group}
        </p>
      )}
      <h1 className="truncate font-heading text-base font-bold leading-tight sm:text-lg">
        {title}
      </h1>
    </div>
  );
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur-md sm:px-4">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenu}
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <PageTitle />

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Notificaciones"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notificaciones</span>
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
                {NOTIFICATIONS.length} nuevas
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {NOTIFICATIONS.map((n) => (
              <DropdownMenuItem key={n.title} className="flex items-start gap-3 py-2.5">
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: n.color }}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{n.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{n.desc}</p>
                </div>
                <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                  {n.time}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
