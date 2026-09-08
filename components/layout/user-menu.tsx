"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut, UserRoundCog } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/store";
import { getRole } from "@/lib/auth/roles";
import { initials } from "@/lib/format";

export function UserMenu() {
  const router = useRouter();
  const session = useAuth((s) => s.session);
  const logout = useAuth((s) => s.logout);

  if (!session) return null;
  const role = getRole(session.roleId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto gap-2 px-1.5 py-1.5 sm:px-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback
              className="text-xs font-bold text-white"
              style={{ backgroundColor: role.color }}
            >
              {initials(session.user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-left leading-tight md:block">
            <p className="max-w-[10rem] truncate text-sm font-semibold">
              {session.user.name}
            </p>
            <p className="text-xs text-muted-foreground">{role.short}</p>
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-3 py-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback
              className="text-xs font-bold text-white"
              style={{ backgroundColor: role.color }}
            >
              {initials(session.user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{session.user.name}</p>
            <p className="truncate text-xs font-normal text-muted-foreground">
              {session.user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => router.push("/mi-cuenta")}>
          <UserRoundCog className="h-4 w-4" />
          Mi cuenta
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            logout();
            toast.success("Sesión cerrada");
            router.replace("/login");
          }}
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
