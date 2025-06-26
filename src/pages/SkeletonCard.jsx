export default function SkeletonCard() {
  return (
    <div className="bg-zinc-900 border-2 border-[#f1c40f] rounded-lg p-3 animate-pulse">
      <div className="h-40 bg-zinc-700 rounded mb-3" />
      <div className="space-y-2">
        <div className="h-3 bg-zinc-700 rounded w-5/6" />
        <div className="h-3 bg-zinc-700 rounded w-2/3" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-8 bg-[#f1c40f] w-24 rounded" />
        <div className="h-8 bg-zinc-700 w-24 rounded" />
      </div>
    </div>
  );
}