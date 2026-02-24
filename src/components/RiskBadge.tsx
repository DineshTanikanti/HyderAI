export default function RiskBadge({ percent }: { percent: number }) {
  let label = "Low Risk";
  let color = "bg-green-500";

  if (percent < 50) {
    label = "High Risk";
    color = "bg-red-500";
  } else if (percent < 80) {
    label = "Medium Risk";
    color = "bg-yellow-500";
  }

  return (
    <div className={`px-4 py-1 rounded-full text-sm ${color}`}>
      {label}
    </div>
  );
}