'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Settings, Shield } from 'lucide-react';
import { isCraftMode } from '@/config/app-mode';

export function AdminSubNav() {
  const pathname = usePathname();
  const craft = isCraftMode();

  const navItems = [
    {
      href: '/admin',
      label: craft ? 'Betriebs-Übersicht' : 'Admin-Übersicht',
      icon: <LayoutDashboard size={16} />,
      active: pathname === '/admin',
    },
    {
      href: '/admin/users',
      label: craft ? 'Monteure & Personalverwaltung' : 'Benutzerverwaltung',
      icon: <Users size={16} />,
      active: pathname.startsWith('/admin/users'),
    },
    {
      href: '/admin/settings',
      label: craft ? 'Betriebs-Einstellungen & Lizenzen' : 'System-Einstellungen',
      icon: <Settings size={16} />,
      active: pathname.startsWith('/admin/settings'),
    },
  ];

  return (
    <div className="border-b border-border/40 bg-card/20 backdrop-blur-sm sticky top-0 z-10 px-6 sm:px-8 py-3">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
          <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Shield size={16} />
          </div>
          <span>{craft ? 'Handwerks-Betriebsleitung & Administration' : 'Administration & System'}</span>
        </div>

        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/40 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                item.active
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
