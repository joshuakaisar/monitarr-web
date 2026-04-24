/** macOS-style terminal block with traffic lights, title bar, and colored line segments. */

import { BlinkingCursor } from "./BlinkingCursor";

interface TerminalSegment {
  text: string;
  type: "prompt" | "value" | "warning" | "error" | "muted" | "default";
}

interface TerminalLine {
  segments: TerminalSegment[];
}

interface TerminalBlockProps {
  title?: string;
  lines: TerminalLine[];
  showCursor?: boolean;
  className?: string;
}

const SEGMENT_COLORS: Record<TerminalSegment["type"], string> = {
  prompt: "var(--color-accent-terminal)",
  value: "var(--color-text-default)",
  warning: "var(--color-semantic-warning)",
  error: "var(--color-semantic-error)",
  muted: "var(--color-text-muted)",
  default: "var(--color-text-secondary)",
};

export function TerminalBlock({
  title = "monitarr \u2014 system",
  lines,
  showCursor = false,
  className = "",
}: TerminalBlockProps) {
  return (
    <div
      className={`rounded-lg overflow-hidden font-mono text-sm ${className}`}
      style={{ background: "#1b1d23", border: "0.5px solid #2E3035" }}
    >
      {/* Title bar */}
      <div
        className="flex items-center px-3 py-2"
        style={{ borderBottom: "0.5px solid #2E3035" }}
      >
        <div className="flex items-center" style={{ gap: "3px" }}>
          <span
            className="inline-block rounded-full"
            style={{ width: "7px", height: "7px", background: "#ff5f57" }}
          />
          <span
            className="inline-block rounded-full"
            style={{ width: "7px", height: "7px", background: "#febc2e" }}
          />
          <span
            className="inline-block rounded-full"
            style={{ width: "7px", height: "7px", background: "#28c840" }}
          />
        </div>
        <span className="flex-1 text-center text-xs text-text-muted">
          {title}
        </span>
      </div>

      {/* Terminal body */}
      <div className="p-3 space-y-1">
        {lines.map((line, i) => (
          <div key={i} className="leading-relaxed">
            {line.segments.map((seg, j) => (
              <span key={j} style={{ color: SEGMENT_COLORS[seg.type] }}>
                {seg.text}
              </span>
            ))}
            {showCursor && i === lines.length - 1 && (
              <>
                {" "}
                <BlinkingCursor />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
