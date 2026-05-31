'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Timer,
  BarChart3,
  Menu 
} from 'lucide-react';
import { useTimerStore } from '@/lib/store';

const tabs = [
  { id: 'dashboard', href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'tasks', href: '/tasks', icon: CheckSquare, label: 'Aufgaben' },
  { id: 'planner', href: '/planner', icon: BarChart3, label: 'Planer' },
  { id: 'timer', href: '/time', icon: Timer, label: 'Timer' },
  { id: 'more', href: '#', icon: Menu, label: 'Mehr' },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const { runningTaskId } = useTimerStore();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border safe-area-pb">
      <ul className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = tab.id === 'more' 
            ? pathname.startsWith('/clients') || pathname.startsWith('/team') || pathname.startsWith('/reports') || pathname.startsWith('/admin') || pathname.startsWith('/notifications')
            : tab.href === '/' 
              ? pathname === '/' 
              : pathname.startsWith(tab.href);
          
          return (
            <li key={tab.id} className="flex-1">
              <Link
                href={tab.id === 'more' ? '/notifications' : tab.href}
                className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center h-full gap-1 text-[10px] font-medium transition-colors ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="relative">
                  <tab.icon size={20} />
                  {tab.id === 'timer' && runningTaskId && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                </div>
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
