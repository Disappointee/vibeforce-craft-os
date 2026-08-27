import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function ClientsLoading() {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-40 bg-muted" />
            <Skeleton className="h-4 w-72 bg-muted" />
          </div>
          <Skeleton className="h-10 w-40 rounded-xl bg-muted" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border bg-card/30">
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-32 bg-muted" />
                <Skeleton className="h-4 w-24 bg-muted" />
                <Skeleton className="h-4 w-40 bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
