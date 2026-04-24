export type ServiceName = "sonarr" | "radarr" | "lidarr" | "prowlarr";

export type ServiceStatus = {
  connected: boolean;
  version: string | null;
  error?: string;
};

export type SystemStatus = Record<ServiceName, ServiceStatus>;

export type QueueItemStatus =
  | "downloading"
  | "stalled"
  | "paused"
  | "completed"
  | "failed"
  | "pending";

export type QueueItem = {
  id: string;
  title: string;
  subtitle: string;
  service: "sonarr" | "radarr" | "lidarr";
  status: QueueItemStatus;
  progress: number;
  eta: string | null;
  size: number;
  quality: string;
  indexer?: string;
  addedAt: string;
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

export type ActivityEventType =
  | "grabbed"
  | "imported"
  | "failed"
  | "deleted"
  | "renamed";

export type ActivityEvent = {
  id: string;
  title: string;
  subtitle: string;
  service: "sonarr" | "radarr" | "lidarr";
  eventType: ActivityEventType;
  quality: string;
  date: string;
  size?: number;
  indexer?: string;
  releaseTitle?: string;
};

export type ActivityGroup = {
  date: string;
  events: ActivityEvent[];
};
