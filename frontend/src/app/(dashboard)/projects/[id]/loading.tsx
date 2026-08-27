import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectDetailsLoading() {
  return (
    <div className="h-full p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full bg-card" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-8 w-72 bg-card" />
            <Skeleton className="h-4 w-96 bg-card" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-[120px] rounded-lg bg-card" />
            <Skeleton className="h-10 w-40 rounded-xl bg-card" />
          </div>
        </div>
        {/* Content skeleton */}
        <Skeleton className="h-[500px] w-full bg-card/40 rounded-2xl" />
      </div>
    </div>
  );
}
