"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, LogOut, Menu, Settings, UserRound } from "lucide-react";
import { toast } from "sonner";
import { logout } from "@/lib/api";
import { getInitials, useUserProfile } from "@/lib/user-profile";
import { STAFF_ROLES } from "@/components/auth/role-gate";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NotificationPanel } from "@/components/notifications/notification-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandPalette } from "@/components/ui/command-palette";
import { AcademicFilterBar } from "./academic-filter-bar";
import { accountNavigation, staffNavigation } from "./navigation";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useUserProfile();
  const [loggingOut, setLoggingOut] = useState(false);
  const title = [...staffNavigation, accountNavigation].find(item => pathname === item.href || pathname.startsWith(item.href + "/"))?.label ?? "Monitor UNG";
  const isStaff = STAFF_ROLES.includes(profile.role.toLowerCase().trim());

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Keluar gagal. Coba lagi.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-20 shrink-0 items-center justify-between gap-2 border-b border-hairline bg-paper/95 px-3 backdrop-blur-sm sm:px-6">

      <div className="flex min-w-0 items-center gap-3">

        <SidebarTrigger aria-label="Buka navigasi" className="size-11 md:hidden">
          <Menu className="size-5" aria-hidden="true" />
        </SidebarTrigger>

        <div className="hidden min-w-0 sm:block">

          <p className="text-xs font-medium text-muted-foreground">Ruang kerja staf</p>

          <p className="truncate text-base font-semibold text-ink">
            {title}
          </p>
        </div>

        <span className="truncate text-sm font-semibold text-ink sm:hidden">
          {title}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">

        {isStaff && <AcademicFilterBar />}

        <CommandPalette />

        <ThemeToggle compact />

        <NotificationPanel />

        <DropdownMenu>

          <DropdownMenuTrigger render={<button
            type="button"
            aria-label="Buka menu akun"
            className="flex min-h-11 items-center gap-2 rounded-lg p-1.5 hover:bg-muted"
          >

            <Avatar className="size-8">

              {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt="" />}

              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-ink">
                {getInitials(profile.fullName)}
              </AvatarFallback>
            </Avatar>

            <span className="hidden max-w-32 truncate text-sm font-medium lg:block">
              {profile.fullName}
            </span>

            <ChevronDown className="hidden size-4 sm:block" aria-hidden="true" />
          </button>} />

          <DropdownMenuContent align="end" className="w-64 bg-card p-2">

            <div className="mb-2 border-b border-hairline px-3 py-3">

              <p className="truncate font-semibold">
                {profile.fullName}
              </p>

              <p className="truncate text-sm text-muted-foreground">
                {profile.email}
              </p>
            </div>

            <DropdownMenuItem render={<Link href="/profile" />} className="min-h-11 gap-3"><UserRound aria-hidden="true" />Akun Saya</DropdownMenuItem>

            {isStaff && <DropdownMenuItem render={<Link href="/settings" prefetch={false} />} className="min-h-11 gap-3"><Settings aria-hidden="true" />Pengaturan</DropdownMenuItem>}

            <DropdownMenuItem disabled={loggingOut} onClick={handleLogout} className="min-h-11 gap-3 text-destructive">
              <LogOut aria-hidden="true" />
              {loggingOut ? "Sedang keluar..." : "Keluar"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
