export type ServiceName = "sonarr" | "radarr" | "lidarr" | "prowlarr";

export type ServiceStatus = {
  connected: boolean;
  version: string | null;
  error?: string;
};

export type SystemStatus = Record<ServiceName, ServiceStatus>;

export type QueueItem = {
  id: number;
  title: string;
  service: "sonarr" | "radarr" | "lidarr";
  status: string;
  progress: number;
  eta: string | null;
  size: number;
  quality: string;
};

export type QueueResponse = {
  items: QueueItem[];
  totalCount: number;
};

export type ActivityItem = {
  id: number;
  title: string;
  eventType: string;
  service: "sonarr" | "radarr";
  date: string;
  quality: string;
};
