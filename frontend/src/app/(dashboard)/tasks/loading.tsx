import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function TasksLoading() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48 bg-muted" />
            <Skeleton className="h-4 w-64 bg-muted" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-[240px] rounded-xl bg-muted" />
            <Skeleton className="h-10 w-36 rounded-xl bg-muted" />
          </div>
        </div>
        <Card className="border-border bg-card/30">
          <CardContent className="p-0">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 border-b border-border/50 flex items-center gap-4">
                <Skeleton className="h-4 w-1/4 bg-muted" />
                <Skeleton className="h-4 w-1/6 bg-muted" />
                <Skeleton className="h-4 w-1/6 bg-muted" />
                <Skeleton className="h-4 w-full bg-muted" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
