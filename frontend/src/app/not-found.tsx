import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion, Home } from 'lucide-react';

export default function GlobalNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md px-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <FileQuestion size={32} className="text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Seite nicht gefunden
          </h1>
          <p className="text-sm text-muted-foreground">
            Die angeforderte Seite existiert nicht oder wurde verschoben.
          </p>
        </div>
        <Link href="/">
          <Button variant="outline" className="border-border text-foreground hover:bg-accent/50">
            <Home size={16} className="mr-2" />
            Zurück zum Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
