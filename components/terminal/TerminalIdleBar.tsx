/** Compact terminal bar that types out a message character by character on mount. */
"use client";

import { useEffect, useState } from "react";
import { BlinkingCursor } from "./BlinkingCursor";

interface TerminalIdleBarProps {
  message: string;
}

export function TerminalIdleBar({ message }: TerminalIdleBarProps) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let i = 0;
    setDisplayed("");
    const id = setInterval(() => {
      i++;
      setDisplayed(message.slice(0, i));
      if (i >= message.length) clearInterval(id);
    }, 40);
    return () => clearInterval(id);
  }, [message]);

  return (
    <div
      className="rounded-lg font-mono text-sm text-text-default"
      style={{
        background: "#1b1d23",
        border: "0.5px solid #2E3035",
        padding: "9px 12px",
      }}
    >
      <span style={{ color: "var(--color-accent-terminal)" }}>$ </span>
      {displayed}
      {" "}
      <BlinkingCursor />
    </div>
  );
}
