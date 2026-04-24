/** Badge displaying a service name with its brand color. */

const SERVICE_COLORS = {
  sonarr: "var(--color-service-sonarr)",
  radarr: "var(--color-service-radarr)",
  lidarr: "var(--color-service-lidarr)",
  prowlarr: "var(--color-service-prowlarr)",
  qbit: "var(--color-service-qbit)",
  sabnzbd: "var(--color-service-sabnzbd)",
  docker: "var(--color-service-docker)",
  portainer: "var(--color-service-portainer)",
} as const;

type Service = keyof typeof SERVICE_COLORS;

interface ServiceBadgeProps {
  service: Service;
  size?: "sm" | "md";
}

export function ServiceBadge({ service, size = "md" }: ServiceBadgeProps) {
  const color = SERVICE_COLORS[service];

  return (
    <span
      className={`inline-flex items-center font-mono font-bold uppercase tracking-[0.3px] rounded-[3px] ${
        size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1"
      }`}
      style={{
        color,
        backgroundColor: `color-mix(in srgb, ${color} 12.5%, transparent)`,
      }}
    >
      {service}
    </span>
  );
}
