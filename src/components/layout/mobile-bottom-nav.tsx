"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUserProfile } from "@/lib/user-profile";
import { STAFF_ROLES } from "@/components/auth/role-gate";
import { accountNavigation, staffNavigation } from "./navigation";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { profile } = useUserProfile();
  const items = STAFF_ROLES.includes(profile.role.toLowerCase().trim())
    ? [...["/dashboard", "/students", "/monitoring", "/reports"].map(href => staffNavigation.find(item => item.href === href)!), accountNavigation]
    : [accountNavigation];
  return (
    <nav aria-label="Navigasi cepat" className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-card pb-[env(safe-area-inset-bottom)] md:hidden">

      <ul className="flex">

        {items.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return <li key={item.href} className="min-w-0 flex-1">

            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn("flex min-h-16 flex-col items-center justify-center gap-1 border-t-2 px-0.5 py-2 text-xs font-medium", active ? "border-primary bg-primary/10 text-ink" : "border-transparent text-muted-foreground hover:text-ink")}
            >

              <Icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
              <span>
                {item.href === "/profile" ? "Akun" : item.label}
              </span>
            </Link>
          </li>;
        })}
      </ul>
    </nav>
  );
}
