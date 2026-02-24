export default function WaterBottle({ percent }: { percent: number }) {
  return (
    <div className="w-40 h-72 bg-gray-600 rounded-3xl overflow-hidden relative shadow-lg">
      <div
        className="absolute bottom-0 w-full bg-gradient-to-t from-cyan-500 to-blue-400 transition-all duration-700"
        style={{ height: `${percent}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-center text-xl font-bold">
        {percent}%
      </div>
    </div>
  );
}