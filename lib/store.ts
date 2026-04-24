import { create } from "zustand";

type Theme = "light" | "dark" | "oled" | "system";
type Service = "sonarr" | "radarr" | "lidarr" | "prowlarr";

interface AppState {
  theme: Theme;
  sidebarCollapsed: boolean;
  configuredServices: Service[];
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setConfiguredServices: (services: Service[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: "dark",
  sidebarCollapsed: false,
  configuredServices: [],
  setTheme: (theme) => set({ theme }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setConfiguredServices: (services) => set({ configuredServices: services }),
}));
