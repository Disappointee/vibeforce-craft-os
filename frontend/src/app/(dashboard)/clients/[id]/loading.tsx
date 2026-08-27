import { Skeleton } from '@/components/ui/skeleton';

export default function ClientDetailsLoading() {
  return (
    <div className="h-full p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full bg-card" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 bg-card" />
            <Skeleton className="h-4 w-48 bg-card" />
          </div>
        </div>
        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48 bg-card/40 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-48 bg-card/40 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-28 bg-card/40 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-28 bg-card/40 rounded-2xl" />
        </div>
        <Skeleton className="h-[400px] bg-card/40 rounded-2xl" />
        <Skeleton className="h-48 bg-card/40 rounded-2xl" />
        <Skeleton className="h-64 bg-card/40 rounded-2xl" />
      </div>
    </div>
  );
}
