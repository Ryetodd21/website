"use client";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SidebarProvider } from "@/components/ui/sidebar";
import { UserProfileProvider } from "@/lib/user-profile";
import { AcademicFilterProvider } from "@/lib/academic-filter";
import { InstitutionProvider } from "@/lib/institution";
import { AuthGuard } from "@/components/auth/auth-guard";
import { RoleGate, STAFF_ROLES } from "@/components/auth/role-gate";
import { ShortcutsHelp } from "@/components/ui/shortcuts-help";

// Routes inside (dashboard) that require admin/dosen role.
// /settings is included — the page exposes admin-only operations
// (institution profile, campuses, user accounts, JWT, notifications).
// Mahasiswa users should use the Android mobile app, not the web dashboard.
const STAFF_PATH_PREFIXES = [
  "/dashboard",
  "/monitoring",
  "/students",
  "/logs",
  "/ai",
  "/models",
  "/reports",
  "/akademik",
  "/settings",
];

function isStaffPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return STAFF_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const gate = isStaffPath(pathname);

  const content = gate ? (
    <RoleGate allow={STAFF_ROLES}>{children}</RoleGate>
  ) : (
    children
  );

  return (
    <AuthGuard>
      <InstitutionProvider>
        <UserProfileProvider>
          <AcademicFilterProvider>
            <SidebarProvider defaultOpen className="dashboard-shell">
              <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:p-4 focus:text-ink">Lewati navigasi</a>
              <AppSidebar />
              <div className="flex min-w-0 flex-1 flex-col">
                <Header />
                <main id="main-content" tabIndex={-1} className="mx-auto w-full min-w-0 max-w-[1600px] flex-1 px-4 pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 md:pb-8">{content}</main>
              </div>
              <ShortcutsHelp />
              <MobileBottomNav />
            </SidebarProvider>
          </AcademicFilterProvider>
        </UserProfileProvider>
      </InstitutionProvider>
    </AuthGuard>
  );
}
