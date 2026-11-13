"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUserProfile } from "@/lib/user-profile";
import { useInstitution } from "@/lib/institution";
import { STAFF_ROLES } from "@/components/auth/role-gate";
import { cn } from "@/lib/utils";
import { accountNavigation, staffNavigation } from "./navigation";

export function AppSidebar() {
  const pathname = usePathname();
  const { state, toggleSidebar, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const { profile } = useUserProfile();
  const { profile: institution } = useInstitution();
  const isStaff = STAFF_ROLES.includes(profile.role.toLowerCase().trim());
  const items = isStaff ? [...staffNavigation, accountNavigation] : [accountNavigation];
  const ToggleIcon = isMobile ? X : collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <Sidebar collapsible="icon" className="border-r border-hairline [&_[data-slot=sidebar-inner]]:bg-card">

      <SidebarHeader className={cn("gap-4 border-b border-hairline p-4", collapsed && "items-center px-2")}>

        <Link
          href={isStaff ? "/dashboard" : "/profile"}
          aria-label="Monitor UNG, halaman utama"
          className="flex min-h-11 items-center gap-3"
        >

          <Image src="/ung-logo.webp" alt="" width={36} height={40} className="h-10 w-9 shrink-0 object-contain" />

          {!collapsed && <span className="min-w-0">
            <span className="block font-heading text-lg font-extrabold tracking-tight text-ink">MONITOR UNG</span>
            <span className="block text-sm text-muted-foreground">Pendampingan belajar</span>
          </span>}
        </Link>

        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={isMobile ? "Tutup navigasi" : collapsed ? "Perluas navigasi" : "Ciutkan navigasi"}
          aria-expanded={!collapsed}
          className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted hover:text-ink"
        >

          <ToggleIcon className="size-5 shrink-0" aria-hidden="true" />

          {!collapsed && <span>
            {isMobile ? "Tutup navigasi" : "Ciutkan navigasi"}
          </span>}
        </button>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">

        <nav aria-label="Menu utama">

          {Array.from(new Set(items.map(item => item.group))).map(group => (
            <div key={group} className="mb-5 last:mb-0">

              {!collapsed && <p className="mb-2 px-3 text-xs font-semibold tracking-wide text-muted-foreground">
                {group}
              </p>}

              <ul className="space-y-1">

                {items.filter(item => item.group === group).map(item => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  const link = <Link
                    href={item.href}
                    prefetch={item.href === "/settings" ? false : undefined}
                    aria-current={active ? "page" : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    onClick={() => { if (isMobile) setOpenMobile(false); }}
                    className={cn("flex min-h-12 items-center gap-3 rounded-lg border-l-2 px-3 text-base transition-colors", collapsed && "justify-center px-2", active ? "border-primary bg-primary/10 font-semibold text-ink" : "border-transparent text-ink/75 hover:bg-muted hover:text-ink")}
                  >

                    <Icon className="size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />

                    {!collapsed && <span>
                      {item.label}
                    </span>}
                  </Link>;
                  return <li key={item.href}>
                    {collapsed ? <Tooltip>
                      <TooltipTrigger render={link} />
                      <TooltipContent side="right">
                        {item.label}
                      </TooltipContent>
                    </Tooltip> : link}
                  </li>;
                })}
              </ul>
            </div>
          ))}
        </nav>
      </SidebarContent>

      {!collapsed && <SidebarFooter className="border-t border-hairline p-5 text-sm text-muted-foreground">

        <p className="font-semibold text-ink">
          {institution.universityName || "Universitas Negeri Gorontalo"}
        </p>

        <p>
          {institution.program || "Monitoring aktivitas belajar"}
        </p>
      </SidebarFooter>}
    </Sidebar>
  );
}
