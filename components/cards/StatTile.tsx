export function StatTile({ label, value }: { label: string; value: string | number }) {
  // TODO: Implement stat tile card
  return (
    <div className="bg-bg-secondary rounded-medium p-lg">
      <p className="text-text-secondary text-sm">{label}</p>
      <p className="text-text-default text-2xl font-bold">{value}</p>
    </div>
  );
}
