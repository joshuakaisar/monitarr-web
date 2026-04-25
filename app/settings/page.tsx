"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import { ServiceBadge } from "@/components/badges/ServiceBadge";
import { StatusBadge } from "@/components/badges/StatusBadge";
import {
  EyeIcon,
  EyeSlashIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ServiceName = "sonarr" | "radarr" | "lidarr" | "prowlarr" | "qbit";

interface ServiceConfig {
  service: ServiceName;
  label: string;
  url: string;
  apiKey: string;
  apiPath: string;
}

type SettingsSection = "instances" | "appearance" | "general" | "about";

type TestPhase = "idle" | "testing" | "success" | "error";

interface TestResult {
  phase: TestPhase;
  lines: TestLine[];
  spinnerActive: boolean;
  version?: string;
  error?: string;
}

interface TestLine {
  text: string;
  visible: boolean;
  charIndex: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SERVICES: ServiceConfig[] = [
  {
    service: "sonarr",
    label: "Sonarr",
    url: "",
    apiKey: "",
    apiPath: "/api/sonarr/api/v3/system/status",
  },
  {
    service: "radarr",
    label: "Radarr",
    url: "",
    apiKey: "",
    apiPath: "/api/radarr/api/v3/system/status",
  },
  {
    service: "lidarr",
    label: "Lidarr",
    url: "",
    apiKey: "",
    apiPath: "/api/lidarr/api/v1/system/status",
  },
  {
    service: "prowlarr",
    label: "Prowlarr",
    url: "",
    apiKey: "",
    apiPath: "/api/prowlarr/api/v1/system/status",
  },
  {
    service: "qbit",
    label: "qBittorrent",
    url: "",
    apiKey: "",
    apiPath: "",
  },
];

const SECTIONS: { key: SettingsSection; label: string }[] = [
  { key: "instances", label: "Instances" },
  { key: "appearance", label: "Appearance" },
  { key: "general", label: "General" },
  { key: "about", label: "About" },
];

const BRAILLE_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

const ACCENT_COLORS = [
  { name: "Blue", hex: "#0A84FF" },
  { name: "Purple", hex: "#BF5AF2" },
  { name: "Pink", hex: "#FF375F" },
  { name: "Red", hex: "#FF453A" },
  { name: "Orange", hex: "#FF9F0A" },
  { name: "Green", hex: "#30D158" },
  { name: "Teal", hex: "#64D2FF" },
  { name: "Indigo", hex: "#5E5CE6" },
];

// ---------------------------------------------------------------------------
// Braille Spinner hook
// ---------------------------------------------------------------------------

function useBrailleSpinner(active: boolean): string {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % BRAILLE_FRAMES.length);
    }, 80);
    return () => clearInterval(interval);
  }, [active]);

  return active ? BRAILLE_FRAMES[frame] : "";
}

// ---------------------------------------------------------------------------
// Typewriter hook
// ---------------------------------------------------------------------------

function useTypewriter(text: string, active: boolean, charDelay = 30): string {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    if (!active) {
      setDisplayed("");
      return;
    }
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, charDelay);
    return () => clearInterval(interval);
  }, [text, active, charDelay]);

  return displayed;
}

// ---------------------------------------------------------------------------
// ConnectionTestReadout
// ---------------------------------------------------------------------------

interface ConnectionTestReadoutProps {
  service: string;
  url: string;
  result: TestResult;
}

function ConnectionTestReadout({
  service,
  url,
  result,
}: ConnectionTestReadoutProps) {
  const spinner = useBrailleSpinner(result.spinnerActive);

  const line1Text = `$ testing ${service.toLowerCase()} connection...`;
  const line2Text = `endpoint : ${url || "(not set)"}`;
  const line3Text =
    result.phase === "success"
      ? `version  : ${result.version ?? "unknown"}`
      : result.phase === "error"
        ? `error    : ${result.error ?? "unknown error"}`
        : "";
  const line4Text =
    result.phase === "success"
      ? "✓ connected successfully"
      : result.phase === "error"
        ? "✗ connection failed"
        : "";

  const line1 = useTypewriter(line1Text, result.lines[0]?.visible ?? false);
  const line2 = useTypewriter(line2Text, result.lines[1]?.visible ?? false);
  const line3 = useTypewriter(line3Text, result.lines[2]?.visible ?? false);
  const line4 = useTypewriter(line4Text, result.lines[3]?.visible ?? false);

  const showLine = (idx: number) => result.lines[idx]?.visible ?? false;

  return (
    <div
      className="mt-3 rounded-lg overflow-hidden font-mono text-sm animate-slide-up"
      style={{ background: "#1b1d23", border: "0.5px solid #2E3035" }}
    >
      <div className="p-3 space-y-1 text-[13px] leading-relaxed">
        {showLine(0) && (
          <div>
            <span style={{ color: "var(--color-accent-terminal)" }}>
              {line1}
            </span>
            {result.spinnerActive && (
              <span
                className="ml-2"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {spinner}
              </span>
            )}
          </div>
        )}
        {showLine(1) && (
          <div style={{ color: "var(--color-text-secondary)" }}>{line2}</div>
        )}
        {showLine(2) && (
          <div
            style={{
              color:
                result.phase === "error"
                  ? "var(--color-semantic-error)"
                  : "var(--color-text-secondary)",
            }}
          >
            {line3}
          </div>
        )}
        {showLine(3) && (
          <div
            style={{
              color:
                result.phase === "success" ? "#7EE787" : "#FF453A",
              fontWeight: 600,
            }}
          >
            {line4}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ServiceCard
// ---------------------------------------------------------------------------

function ServiceCard({ config }: { config: ServiceConfig }) {
  const [url, setUrl] = useState(config.url);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [showKey, setShowKey] = useState(false);
  const [testResult, setTestResult] = useState<TestResult>({
    phase: "idle",
    lines: [],
    spinnerActive: false,
  });
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleTest = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const makeLine = (visible = false): TestLine => ({
      text: "",
      visible,
      charIndex: 0,
    });

    setTestResult({
      phase: "testing",
      lines: [makeLine(true), makeLine(), makeLine(), makeLine()],
      spinnerActive: true,
    });

    // Stagger lines
    const delays = [0, 400, 800, 1200];

    await new Promise<void>((resolve) => {
      let revealed = 1;
      const revealNext = () => {
        if (controller.signal.aborted) return;
        if (revealed >= 2) return; // only reveal line 2 before fetch
        revealed++;
        setTestResult((prev) => {
          const lines = [...prev.lines];
          lines[1] = { ...lines[1], visible: true };
          return { ...prev, lines };
        });
      };
      setTimeout(revealNext, delays[1]);
      setTimeout(resolve, delays[1] + 200);
    });

    // Fetch
    try {
      const res = await fetch(config.apiPath, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { version?: string };

      if (controller.signal.aborted) return;

      setIsOnline(true);
      setTestResult((prev) => ({
        phase: "success",
        lines: [
          prev.lines[0],
          prev.lines[1],
          { text: "", visible: true, charIndex: 0 },
          { text: "", visible: false, charIndex: 0 },
        ],
        spinnerActive: false,
        version: data.version ?? "unknown",
      }));

      setTimeout(() => {
        if (controller.signal.aborted) return;
        setTestResult((prev) => ({
          ...prev,
          lines: [
            prev.lines[0],
            prev.lines[1],
            prev.lines[2],
            { text: "", visible: true, charIndex: 0 },
          ],
        }));
      }, delays[3] - delays[2]);
    } catch (err) {
      if (controller.signal.aborted) return;

      const message =
        err instanceof Error ? err.message : "Connection refused";

      setIsOnline(false);
      setTestResult((prev) => ({
        phase: "error",
        lines: [
          prev.lines[0],
          prev.lines[1],
          { text: "", visible: true, charIndex: 0 },
          { text: "", visible: false, charIndex: 0 },
        ],
        spinnerActive: false,
        error: message,
      }));

      setTimeout(() => {
        if (controller.signal.aborted) return;
        setTestResult((prev) => ({
          ...prev,
          lines: [
            prev.lines[0],
            prev.lines[1],
            prev.lines[2],
            { text: "", visible: true, charIndex: 0 },
          ],
        }));
      }, delays[3] - delays[2]);
    }
  }, [config.apiPath]);

  const handleSave = useCallback(() => {
    // Placeholder — runtime config persistence is future scope
    console.log(`Save ${config.service}:`, { url, apiKey });
  }, [config.service, url, apiKey]);

  return (
    <div
      className="rounded-[14px] p-5"
      style={{ background: "#2C2C2E" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <ServiceBadge service={config.service} />
        <span className="text-text-default font-semibold text-[15px]">
          {config.label}
        </span>
        {isOnline !== null && (
          <StatusBadge
            status={isOnline ? "online" : "offline"}
            size="sm"
          />
        )}
      </div>

      {/* Fields */}
      <div className="space-y-3">
        <div>
          <label className="block font-mono text-[11px] uppercase tracking-[0.5px] text-text-muted mb-1.5">
            URL
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="http://localhost:8989"
            className="w-full rounded-[8px] px-3 py-2 text-sm font-mono bg-bg-default text-text-default placeholder:text-text-muted outline-none transition-colors focus:ring-1 focus:ring-accent-blue"
            style={{ border: "0.5px solid var(--color-border-default)" }}
          />
        </div>

        <div>
          <label className="block font-mono text-[11px] uppercase tracking-[0.5px] text-text-muted mb-1.5">
            API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter API key"
              className="w-full rounded-[8px] px-3 py-2 pr-10 text-sm font-mono bg-bg-default text-text-default placeholder:text-text-muted outline-none transition-colors focus:ring-1 focus:ring-accent-blue"
              style={{ border: "0.5px solid var(--color-border-default)" }}
            />
            <button
              type="button"
              onClick={() => setShowKey((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
            >
              {showKey ? (
                <EyeSlashIcon className="w-4 h-4" />
              ) : (
                <EyeIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Note */}
      <p className="mt-3 text-[11px] text-text-muted font-mono">
        Connection uses values from your .env file.
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4">
        <button
          type="button"
          onClick={handleTest}
          disabled={testResult.phase === "testing"}
          className="px-3 py-1.5 rounded-[8px] font-mono text-[12px] font-semibold transition-colors disabled:opacity-50"
          style={{
            background: "var(--color-bg-tertiary)",
            color: "var(--color-text-default)",
          }}
        >
          Test Connection
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-3 py-1.5 rounded-[8px] font-mono text-[12px] font-semibold transition-colors"
          style={{
            background: "var(--color-accent-blue)",
            color: "#fff",
          }}
        >
          Save
        </button>
      </div>

      {/* Test readout */}
      {testResult.phase !== "idle" && (
        <ConnectionTestReadout
          service={config.label}
          url={url}
          result={testResult}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Instances Section
// ---------------------------------------------------------------------------

function InstancesSection() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-text-default mb-1">
        Instances
      </h2>
      <p className="text-sm text-text-secondary mb-5">
        Manage your arr service connections.
      </p>
      <div className="space-y-4">
        {SERVICES.map((svc) => (
          <ServiceCard key={svc.service} config={svc} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Appearance Section
// ---------------------------------------------------------------------------

interface ThemeOption {
  key: string;
  label: string;
  preview: string; // background color for swatch
  previewFg: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  { key: "light", label: "Light", preview: "#F5F5F7", previewFg: "#1C1C1E" },
  { key: "dark", label: "Dark", preview: "#1C1C1E", previewFg: "#FFFFFF" },
  { key: "oled", label: "OLED", preview: "#000000", previewFg: "#FFFFFF" },
  { key: "system", label: "System", preview: "linear-gradient(135deg, #F5F5F7 50%, #1C1C1E 50%)", previewFg: "#8E8E93" },
];

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div>
      <h2 className="text-lg font-semibold text-text-default mb-1">
        Appearance
      </h2>
      <p className="text-sm text-text-secondary mb-5">
        Customize the look and feel of Monitarr.
      </p>

      {/* Theme selector */}
      <div className="mb-8">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.5px] text-text-muted mb-3">
          Theme
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {THEME_OPTIONS.map((opt) => {
            const isActive = mounted && theme === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setTheme(opt.key)}
                className="rounded-[12px] p-3 text-left transition-all"
                style={{
                  background: "var(--color-bg-secondary)",
                  border: isActive
                    ? "2px solid #0A84FF"
                    : "2px solid transparent",
                }}
              >
                <div
                  className="w-full h-10 rounded-[8px] mb-2"
                  style={{
                    background: opt.preview,
                    border: "0.5px solid var(--color-border-default)",
                  }}
                >
                  <div className="flex items-center justify-center h-full gap-1">
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: opt.previewFg }}
                    >
                      Aa
                    </span>
                  </div>
                </div>
                <span className="text-sm text-text-default font-medium">
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accent color selector (coming soon) */}
      <div>
        <h3 className="font-mono text-[11px] uppercase tracking-[0.5px] text-text-muted mb-1">
          Accent Color
        </h3>
        <p className="text-[12px] text-text-muted mb-3 font-mono">
          Coming soon
        </p>
        <div className="flex gap-2 flex-wrap">
          {ACCENT_COLORS.map((color) => (
            <div
              key={color.name}
              className="w-8 h-8 rounded-full opacity-30 cursor-not-allowed"
              style={{ background: color.hex }}
              title={color.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// General Section (stub)
// ---------------------------------------------------------------------------

function GeneralSection() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-text-default mb-1">General</h2>
      <p className="text-sm text-text-secondary mb-5">
        General application settings.
      </p>
      <div
        className="rounded-[14px] p-8 flex items-center justify-center"
        style={{ background: "#2C2C2E" }}
      >
        <span className="font-mono text-sm text-text-muted">Coming soon</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// About Section
// ---------------------------------------------------------------------------

function AboutSection() {
  const [health, setHealth] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    fetch("/api/health")
      .then((res) => {
        if (!res.ok) throw new Error("unhealthy");
        return res.json() as Promise<{ status: string }>;
      })
      .then((data) => setHealth(data.status === "ok" ? "ok" : "error"))
      .catch(() => setHealth("error"));
  }, []);

  return (
    <div>
      <h2 className="text-lg font-semibold text-text-default mb-1">About</h2>
      <p className="text-sm text-text-secondary mb-5">
        Application information.
      </p>
      <div
        className="rounded-[14px] p-5 space-y-4"
        style={{ background: "#2C2C2E" }}
      >
        <div>
          <p className="text-text-default font-semibold text-[15px]">
            Monitarr v1.0.0
          </p>
          <p className="text-sm text-text-secondary mt-0.5">
            Self-hosted monitoring for the <em>*arr</em> stack
          </p>
        </div>

        <a
          href="https://github.com/joshuakaisar/monitarr-web"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-mono transition-colors hover:opacity-80"
          style={{ color: "#0A84FF" }}
        >
          GitHub
          <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
        </a>

        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{
              background:
                health === "ok"
                  ? "var(--color-semantic-success)"
                  : health === "error"
                    ? "var(--color-semantic-error)"
                    : "var(--color-text-muted)",
              boxShadow:
                health === "ok"
                  ? "0 0 4px var(--color-semantic-success)"
                  : "none",
            }}
          />
          <span className="text-sm text-text-secondary font-mono">
            {health === "loading"
              ? "Checking..."
              : health === "ok"
                ? "System healthy"
                : "System unhealthy"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Settings Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("instances");

  return (
    <div className="max-w-[960px]">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings navigation */}
        <nav className="lg:w-[200px] shrink-0">
          <ul className="flex lg:flex-col gap-1">
            {SECTIONS.map((section) => (
              <li key={section.key}>
                <button
                  type="button"
                  onClick={() => setActiveSection(section.key)}
                  className="w-full text-left px-3 py-2 rounded-[8px] text-sm font-medium transition-colors"
                  style={{
                    background:
                      activeSection === section.key
                        ? "var(--color-bg-tertiary)"
                        : "transparent",
                    color:
                      activeSection === section.key
                        ? "var(--color-text-default)"
                        : "var(--color-text-secondary)",
                  }}
                >
                  {section.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeSection === "instances" && <InstancesSection />}
          {activeSection === "appearance" && <AppearanceSection />}
          {activeSection === "general" && <GeneralSection />}
          {activeSection === "about" && <AboutSection />}
        </div>
      </div>
    </div>
  );
}
