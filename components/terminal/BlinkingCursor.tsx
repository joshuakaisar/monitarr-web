/** Blinking block cursor for terminal UIs. Uses CSS animation, not JS intervals. */

export function BlinkingCursor() {
  return (
    <span className="text-text-muted animate-[blink_1s_step-end_infinite]">
      &#x2588;
      <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`}</style>
    </span>
  );
}
