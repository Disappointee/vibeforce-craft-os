'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  Timer,
  MoreHorizontal,
} from 'lucide-react';

interface NavTab {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

const TABS: NavTab[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'tasks', label: 'Aufgaben', icon: CheckSquare, path: '/tasks' },
  { id: 'timer', label: 'Timer', icon: Timer, path: '/time' },
  { id: 'more', label: 'Mehr', icon: MoreHorizontal, path: '/clients' },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-14 border-t border-border bg-card/95 backdrop-blur-xl md:hidden">
      <div className="grid h-full grid-cols-4 mx-auto max-w-lg">
        {TABS.map((tab) => {
          const active = isActive(tab.path);
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => router.push(tab.path)}
              className="relative flex flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[44px] w-full"
            >
              <Icon
                size={22}
                className={active ? 'text-[#635BFF]' : 'text-[#71717A]'}
                strokeWidth={active ? 2.5 : 2}
              />
              <span
                className={`text-[10px] font-medium leading-none truncate max-w-[64px] ${
                  active ? 'text-[#635BFF]' : 'text-[#71717A]'
                }`}
              >
                {tab.label}
              </span>
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#635BFF]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
