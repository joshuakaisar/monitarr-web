"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Squares2X2Icon as Squares2X2IconOutline,
  ArrowDownTrayIcon as ArrowDownTrayIconOutline,
  ClockIcon as ClockIconOutline,
  BookOpenIcon as BookOpenIconOutline,
  ServerIcon as ServerIconOutline,
  CubeIcon as CubeIconOutline,
  Cog6ToothIcon as Cog6ToothIconOutline,
} from "@heroicons/react/24/outline";
import {
  Squares2X2Icon as Squares2X2IconSolid,
  ArrowDownTrayIcon as ArrowDownTrayIconSolid,
  ClockIcon as ClockIconSolid,
  BookOpenIcon as BookOpenIconSolid,
  ServerIcon as ServerIconSolid,
  CubeIcon as CubeIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
} from "@heroicons/react/24/solid";
import { useAppStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";

type ServiceStatus = {
  connected: boolean;
  version: string | null;
  error?: string;
};

type StatusResponse = Record<
  "sonarr" | "radarr" | "lidarr" | "prowlarr",
  ServiceStatus
>;

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    iconOutline: Squares2X2IconOutline,
    iconSolid: Squares2X2IconSolid,
    badge: false,
  },
  {
    label: "Queue",
    href: "/queue",
    iconOutline: ArrowDownTrayIconOutline,
    iconSolid: ArrowDownTrayIconSolid,
    badge: true,
  },
  {
    label: "Activity",
    href: "/activity",
    iconOutline: ClockIconOutline,
    iconSolid: ClockIconSolid,
    badge: false,
  },
  {
    label: "Library",
    href: "/library",
    iconOutline: BookOpenIconOutline,
    iconSolid: BookOpenIconSolid,
    badge: false,
  },
] as const;

const indexerItems = [
  {
    label: "Prowlarr",
    href: "/prowlarr",
    iconOutline: ServerIconOutline,
    iconSolid: ServerIconSolid,
  },
  {
    label: "Docker",
    href: "/docker",
    iconOutline: CubeIconOutline,
    iconSolid: CubeIconSolid,
  },
] as const;

const serviceColors: Record<string, string> = {
  sonarr: "bg-service-sonarr",
  radarr: "bg-service-radarr",
  lidarr: "bg-service-lidarr",
  prowlarr: "bg-service-prowlarr",
};

function StatusDot({ status }: { status: "online" | "offline" | "degraded" }) {
  const colorClass =
    status === "online"
      ? "bg-semantic-success"
      : status === "offline"
        ? "bg-semantic-error"
        : "bg-semantic-warning";

  return (
    <span className="relative flex h-[5px] w-[5px]">
      <span
        className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${colorClass}`}
      />
      <span
        className={`relative inline-flex h-[5px] w-[5px] rounded-full ${colorClass}`}
      />
    </span>
  );
}

function NavLink({
  href,
  label,
  iconOutline: IconOutline,
  iconSolid: IconSolid,
  active,
  badge,
  queueCount,
}: {
  href: string;
  label: string;
  iconOutline: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconSolid: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  active: boolean;
  badge?: boolean;
  queueCount?: number;
}) {
  const Icon = active ? IconSolid : IconOutline;

  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-2.5 rounded-md px-3 py-[7px] text-[13px] transition-colors duration-100 ${
        active
          ? "bg-[#1C1C1E] text-white"
          : "text-[#6E6E73] hover:bg-[#1C1C1E] hover:text-[#AEAEB2]"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1 bottom-1 w-[2px] rounded-full bg-accent-blue" />
      )}
      <Icon className="h-[16px] w-[16px] shrink-0" />
      <span>{label}</span>
      {badge && queueCount !== undefined && queueCount > 0 && (
        <span className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-semantic-error px-1 font-mono text-[10px] font-semibold text-white">
          {queueCount}
        </span>
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const configuredServices = useAppStore((s) => s.configuredServices);

  const { data: statusData } = useQuery<StatusResponse>({
    queryKey: ["service-status"],
    queryFn: async () => {
      const res = await fetch("/api/status");
      if (!res.ok) throw new Error("Failed to fetch status");
      return res.json();
    },
  });

  const { data: queueData } = useQuery<{ totalCount: number }>({
    queryKey: ["queue-count"],
    queryFn: async () => {
      const res = await fetch("/api/queue");
      if (!res.ok) throw new Error("Failed to fetch queue");
      return res.json();
    },
  });

  const queueCount = queueData?.totalCount ?? 0;

  return (
    <aside
      className="fixed left-0 top-0 z-40 flex h-screen w-[148px] flex-col border-r border-[#2A2A2C] bg-[#111113]"
      style={{ borderRightWidth: "0.5px" }}
    >
      {/* Logo */}
      <div className="px-4 pt-5 pb-4">
        <h1 className="text-[17px] font-bold tracking-tight text-white">
          Monitarr
        </h1>
        <p className="mt-0.5 font-mono text-[9px] text-[#484F58]">
          v1.0 · self-hosted
        </p>
      </div>

      {/* Main navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={pathname === item.href || pathname.startsWith(item.href + "/")}
            queueCount={item.badge ? queueCount : undefined}
          />
        ))}

        {/* Indexers section */}
        <div className="mt-4 mb-1 px-3">
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.8px] text-[#484F58]">
            Indexers
          </span>
        </div>
        {indexerItems.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={pathname === item.href || pathname.startsWith(item.href + "/")}
          />
        ))}

        {/* Settings at bottom */}
        <div className="mt-auto pb-2">
          <NavLink
            href="/settings"
            label="Settings"
            iconOutline={Cog6ToothIconOutline}
            iconSolid={Cog6ToothIconSolid}
            active={pathname === "/settings" || pathname.startsWith("/settings/")}
          />
        </div>
      </nav>

      {/* Services footer */}
      {configuredServices.length > 0 && (
        <div className="border-t border-[#2A2A2C] px-4 pt-3 pb-4" style={{ borderTopWidth: "0.5px" }}>
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.8px] text-[#484F58]">
            Services
          </span>
          <div className="mt-2 flex flex-col gap-2">
            {configuredServices.map((service) => {
              const info = statusData?.[service];
              const status: "online" | "offline" | "degraded" = info?.connected
                ? "online"
                : info?.error && info.error !== "Not configured"
                  ? "degraded"
                  : "offline";

              return (
                <div key={service} className="flex items-center gap-2">
                  <StatusDot status={status} />
                  <span className="text-[11px] capitalize text-[#8E8E93]">
                    {service}
                  </span>
                  {info?.version && (
                    <span className="ml-auto rounded bg-[#2C2C2E] px-1 py-px font-mono text-[9px] text-[#6E6E73]">
                      {info.version}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
