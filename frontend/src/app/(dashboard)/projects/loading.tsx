import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function ProjectsLoading() {
  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40 bg-muted" />
          <Skeleton className="h-4 w-72 bg-muted" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl bg-muted" />
      </div>
      <div className="flex items-center gap-4 bg-card/20 p-4 rounded-xl border border-border/50">
        <Skeleton className="h-9 w-[180px] rounded-lg bg-muted" />
        <Skeleton className="h-9 w-[180px] rounded-lg bg-muted" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-border bg-card/30">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24 bg-muted" />
                <Skeleton className="h-5 w-16 rounded-full bg-muted" />
              </div>
              <Skeleton className="h-4 w-3/4 bg-muted" />
              <Skeleton className="h-4 w-1/2 bg-muted" />
              <Skeleton className="h-2 w-full rounded-full bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
