/** Section header with mono uppercase label and optional action link. */

interface SectionLabelProps {
  children: React.ReactNode;
  action?: { label: string; onClick: () => void };
}

export function SectionLabel({ children, action }: SectionLabelProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="font-mono uppercase text-[11px] font-semibold tracking-[0.8px] text-text-muted">
        {children}
      </span>
      {action && (
        <button
          onClick={action.onClick}
          className="font-mono text-[11px] text-accent-terminal hover:underline"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
