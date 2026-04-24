"use client";

import { usePathname } from "next/navigation";
import { MagnifyingGlassIcon, BellIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/queue": "Queue",
  "/activity": "Activity",
  "/library": "Library",
  "/prowlarr": "Prowlarr",
  "/docker": "Docker",
  "/settings": "Settings",
};

function formatUptime(startedAt: string): string {
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  const diff = Math.floor((now - start) / 1000);

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function Header() {
  const pathname = usePathname();
  const title = routeTitles[pathname] ?? "Monitarr";

  const { data: statusData } = useQuery<{ uptime?: string }>({
    queryKey: ["app-status"],
    queryFn: async () => {
      const res = await fetch("/api/health");
      if (!res.ok) throw new Error("Failed to fetch health");
      return res.json();
    },
    refetchInterval: 60_000,
  });

  return (
    <header
      className="flex h-[44px] w-full items-center justify-between border-b border-[#2A2A2C] bg-[#1C1C1E] px-5"
      style={{ borderBottomWidth: "0.5px" }}
    >
      {/* Left: Page title */}
      <h2 className="text-[14px] font-semibold text-white">{title}</h2>

      {/* Right: Search, uptime, notifications */}
      <div className="flex items-center gap-3">
        {/* Search bar */}
        <div className="flex h-[28px] w-[110px] items-center gap-1.5 rounded-md bg-[#2C2C2E] px-2">
          <MagnifyingGlassIcon className="h-3.5 w-3.5 text-[#6E6E73]" />
          <input
            type="text"
            placeholder="Search anything…"
            className="w-full bg-transparent text-[11px] text-[#AEAEB2] placeholder-[#6E6E73] outline-none"
          />
        </div>

        {/* Uptime badge */}
        {statusData?.uptime && (
          <span className="font-mono text-[11px] text-[#6E6E73]">
            {formatUptime(statusData.uptime)}
          </span>
        )}

        {/* Notifications */}
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-md text-[#6E6E73] transition-colors duration-100 hover:bg-[#2C2C2E] hover:text-[#AEAEB2]"
        >
          <BellIcon className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
