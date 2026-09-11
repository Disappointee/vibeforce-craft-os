'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { pb } from '@/lib/pocketbase';
import type { UserRecord } from '@/lib/pocketbase-types';
import {
  CheckSquare,
  Users,
  Settings,
  LogOut,
  Search,
  Bell,
  Loader2,
  FolderGit2,
  X,
  Menu,
  Building2,
  Shield,
  UserCircle,
  Timer,
  AlertTriangle,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Zap,
  BookOpen,
  Hammer,
  LayoutDashboard,
  TrendingUp,
} from 'lucide-react';

import Link from 'next/link';
import { getAppConfig, isCraftMode } from '@/config/app-mode';
import { filterProjectsByMode, filterTasksByMode, filterClientsByMode } from '@/lib/data-isolation';
import { SidebarProvider } from '@/components/ui/sidebar';
import { HeaderTimer } from '@/components/layout/HeaderTimer';
import { useUiStore, useSettingsStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { getUserDisplayName, getUserInitials } from '@/lib/user-utils';
import { useOffline } from '@/hooks/use-offline';
import { SimpleActionMenu } from '@/components/layout/SimpleActionMenu';
import { LiveClock } from '@/components/layout/LiveClock';
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { MobileTabBar } from '@/components/layout/MobileTabBar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { NewSimpleTaskDialog } from '@/components/tasks/NewSimpleTaskDialog';
import { NewProjectDialog } from '@/components/projects/NewProjectDialog';
import { NewClientDialog } from '@/components/clients/NewClientDialog';

interface SearchResult {
  type: 'project' | 'task' | 'client' | 'user';
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserRecord | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vibeforce-sidebar-collapsed') === 'true';
    }
    return false;
  });
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isOffline = useOffline();
  const craftModuleEnabled = useSettingsStore((s) => s.craftModuleEnabled);
  const { t } = useI18n();
  const appConfig = getAppConfig();
  const craftMode = isCraftMode();

  const handleOpenTaskDialog = useCallback(() => {
    useUiStore.getState().setTaskDialogOpen(true);
  }, []);

  const handleOpenTimerBar = useCallback(() => {
    useUiStore.getState().setActionMenuOpen(true);
  }, []);

  const handleOpenClientDialog = useCallback(() => {
    useUiStore.getState().setClientDialogOpen(true);
  }, []);

  const handleOpenProjectDialog = useCallback(() => {
    useUiStore.getState().setProjectDialogOpen(true);
  }, []);

  useGlobalShortcuts({
    onOpenTaskDialog: handleOpenTaskDialog,
    onOpenTimerBar: handleOpenTimerBar,
    onOpenClientDialog: handleOpenClientDialog,
    onOpenProjectDialog: handleOpenProjectDialog,
  });

  useEffect(() => {
    const stored = localStorage.getItem('vibeforce-theme');
    if (stored === 'light') {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('vibeforce-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('vibeforce-theme', 'light');
      }
      return next;
    });
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !e.metaKey && !e.ctrlKey && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      try {
        if (pb.authStore.isValid) {
          const existingUser = pb.authStore.record;
          if (existingUser && !cancelled) {
            setUser(existingUser as unknown as UserRecord);
            useSettingsStore.getState().syncFromUserPreferences(existingUser);
          }

          try {
            await Promise.race([
              pb.collection('users').authRefresh(),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('AUTH_TIMEOUT')), 5_000),
              ),
            ]);
            if (!cancelled) {
              const currentRecord = pb.authStore.record;
              setUser(currentRecord as unknown as UserRecord);
              useSettingsStore.getState().syncFromUserPreferences(currentRecord);
            }
          } catch (refreshErr) {
            console.warn('[layout] authRefresh warning (continuing with cached session):', refreshErr);
            if (!pb.authStore.isValid || !pb.authStore.record) {
              if (!cancelled) {
                pb.authStore.clear();
                router.push('/login');
              }
              return;
            }
          }
        } else {
          if (!cancelled) {
            router.push('/login');
          }
          return;
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    initAuth();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const lower = query.toLowerCase();

      const [projectResult, taskResult, clientResult, userResult] = await Promise.allSettled([
        pb.collection('projects').getList(1, 5, {
          filter: pb.filter('name ~ {:q} || key ~ {:q}', { q: lower }),
          sort: '-created',
        }),
        pb.collection('tasks').getList(1, 5, {
          filter: pb.filter('title ~ {:q}', { q: lower }),
          sort: '-created',
          expand: 'project',
        }),
        pb.collection('clients').getList(1, 5, {
          filter: pb.filter('name ~ {:q} || company ~ {:q} || email ~ {:q}', { q: lower }),
          sort: '-created',
        }),
        pb.collection('users').getList(1, 5, {
          filter: pb.filter('name ~ {:q} || email ~ {:q}', { q: lower }),
          sort: 'name',
        }),
      ]);

      const results: SearchResult[] = [];

      if (projectResult.status === 'fulfilled') {
        const isolatedProjects = filterProjectsByMode(projectResult.value.items);
        results.push(...isolatedProjects.map((p: any) => ({
          type: 'project' as const,
          id: p.id,
          title: p.name,
          subtitle: `Projekt · ${p.key}`,
          href: `/projects/${p.id}`,
        })));
      } else {
        console.warn('Project search failed:', projectResult.reason);
      }

      if (taskResult.status === 'fulfilled') {
        const isolatedTasks = filterTasksByMode(taskResult.value.items);
        results.push(...isolatedTasks.map((t: any) => ({
          type: 'task' as const,
          id: t.id,
          title: t.title,
          subtitle: `Task · ${t.expand?.project?.key || '—'}-${t.id.substring(0, 4).toUpperCase()}`,
          href: `/tasks?search=${encodeURIComponent(query)}`,
        })));
      } else {
        console.warn('Task search failed:', taskResult.reason);
      }

      if (clientResult.status === 'fulfilled') {
        const isolatedClients = filterClientsByMode(clientResult.value.items);
        results.push(...isolatedClients.map((c: any) => ({
          type: 'client' as const,
          id: c.id,
          title: c.name,
          subtitle: c.company ? `Kunde · ${c.company}` : 'Kunde',
          href: `/clients/${c.id}`,
        })));
      } else {
        console.warn('Client search failed:', clientResult.reason);
      }

      if (userResult.status === 'fulfilled') {
        results.push(...userResult.value.items.map((u: any) => ({
          type: 'user' as const,
          id: u.id,
          title: u.name || u.email,
          subtitle: u.role ? `Mitarbeiter · ${u.role}` : 'Mitarbeiter',
          href: `/team`,
        })));
      } else {
        console.warn('User search failed:', userResult.reason);
      }

      setSearchResults(results);
      setShowResults(results.length > 0);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(value), 300);
  };

  const handleSearchFocus = () => {
    if (searchResults.length > 0) setShowResults(true);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setShowResults(false);
      router.push(`/tasks?search=${encodeURIComponent(searchQuery.trim())}`);
    }
    if (e.key === 'Escape') {
      setShowResults(false);
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleLogout = () => {
    setLogoutOpen(true);
  };

  const confirmLogout = () => {
    pb.authStore.clear();
    setLogoutOpen(false);
    router.push('/login');
  };

  const {
    taskDialogOpen,
    setTaskDialogOpen,
    projectDialogOpen,
    setProjectDialogOpen,
    clientDialogOpen,
    setClientDialogOpen,
  } = useUiStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground font-medium tracking-wide">
            {craftMode ? 'Vibeforce Craft wird geladen...' : 'Vibeforce Flow wird geladen...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background font-sans text-foreground overflow-hidden">

        {/* Sidebar */}
        <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 ease-in-out border-r border-border bg-sidebar/50 backdrop-blur-xl flex flex-col hidden md:flex z-20 relative`}>
          <button
            type="button"
            onClick={() => {
              const nextState = !sidebarCollapsed;
              setSidebarCollapsed(nextState);
              localStorage.setItem('vibeforce-sidebar-collapsed', String(nextState));
            }}
            className="absolute -right-3 top-20 z-30 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground shadow-md transition-all hover:scale-110 cursor-pointer"
            aria-label={sidebarCollapsed ? "Sidebar ausklappen" : "Sidebar einklappen"}
          >
            {sidebarCollapsed ? (
              <ChevronRight size={12} />
            ) : (
              <ChevronLeft size={12} />
            )}
          </button>

          <div className={`h-16 flex items-center border-b border-border overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'justify-center px-2' : 'px-6'}`}>
            <Link href={appConfig.startRoute} className="flex items-center gap-3 hover:opacity-80 transition-opacity whitespace-nowrap">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg p-1 shadow-sm shrink-0 ${craftMode ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-card'}`}>
                {craftMode ? (
                  <Hammer className="h-5 w-5 text-amber-500" />
                ) : (
                  <img src="/icon-vfos.png" alt="Vibeforce Flow OS Logo" className="h-full w-full object-contain" />
                )}
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col">
                  <span className="font-bold text-base tracking-tight text-foreground transition-all duration-300">{appConfig.appName}</span>
                  {craftMode && <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Handwerk & Bau</span>}
                </div>
              )}
            </Link>
          </div>

          <nav className={`flex-1 space-y-1 overflow-y-auto transition-all duration-300 ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
            {craftMode ? (
              <>
                <NavItem href="/craft" icon={<Hammer size={18} className="text-amber-500" />} label="Handwerks-Zentrale" active={pathname === '/craft' || pathname.startsWith('/craft/')} collapsed={sidebarCollapsed} />
                <NavItem href="/projects" icon={<FolderGit2 size={18} />} label="Baustellen & Bauvorhaben" active={pathname.startsWith('/projects')} collapsed={sidebarCollapsed} />
                <NavItem href="/clients" icon={<Building2 size={18} />} label="Bauherren & Auftraggeber (§ 13b & § 48b)" active={pathname.startsWith('/clients')} collapsed={sidebarCollapsed} />
                <NavItem href="/tasks" icon={<CheckSquare size={18} />} label="Mängel & Baustellen-Aufgaben" active={pathname === '/tasks'} collapsed={sidebarCollapsed} />
                <NavItem href="/time" icon={<Timer size={18} />} label="Monteur-Stempeluhr" active={pathname === '/time'} collapsed={sidebarCollapsed} />
                <NavItem href="/team" icon={<Users size={18} />} label="Monteure & Personal" active={pathname === '/team'} collapsed={sidebarCollapsed} />
                {user?.role === 'admin' && (
                  <NavItem href="/admin/users" icon={<Shield size={18} />} label={t('nav.admin')} active={pathname.startsWith('/admin')} collapsed={sidebarCollapsed} />
                )}
                <NavItem href="/notifications" icon={<Bell size={18} />} label={t('nav.notifications')} active={pathname === '/notifications'} collapsed={sidebarCollapsed} />
                <NavItem href="/docs" icon={<BookOpen size={18} />} label="VOB-Wissen & Dokumentation" active={pathname === '/docs'} collapsed={sidebarCollapsed} />
              </>
            ) : (
              <>
                <NavItem href="/" icon={<LayoutDashboard size={18} />} label={appConfig.navigation.dashboard || 'Dashboard'} active={pathname === '/'} collapsed={sidebarCollapsed} />
                <NavItem href="/tasks" icon={<CheckSquare size={18} />} label={t('nav.my_tasks')} active={pathname === '/tasks'} collapsed={sidebarCollapsed} />
                <NavItem href="/time" icon={<Timer size={18} />} label={t('nav.my_times')} active={pathname === '/time'} collapsed={sidebarCollapsed} />
                <NavItem href="/projects" icon={<FolderGit2 size={18} />} label={t('nav.projekte')} active={pathname.startsWith('/projects')} collapsed={sidebarCollapsed} />
                <NavItem href="/clients" icon={<Building2 size={18} />} label={t('nav.clients')} active={pathname.startsWith('/clients')} collapsed={sidebarCollapsed} />
                <NavItem href="/reports" icon={<TrendingUp size={18} />} label="Finanzen & Berichte" active={pathname.startsWith('/reports')} collapsed={sidebarCollapsed} />
                <NavItem href="/team" icon={<Users size={18} />} label={t('nav.team')} active={pathname === '/team'} collapsed={sidebarCollapsed} />
                {user?.role === 'admin' && (
                  <NavItem href="/admin/users" icon={<Shield size={18} />} label={t('nav.admin')} active={pathname.startsWith('/admin')} collapsed={sidebarCollapsed} />
                )}
                <NavItem href="/notifications" icon={<Bell size={18} />} label={t('nav.notifications')} active={pathname === '/notifications'} collapsed={sidebarCollapsed} />
                <NavItem href="/docs" icon={<BookOpen size={18} />} label={t('nav.docs')} active={pathname === '/docs'} collapsed={sidebarCollapsed} />
              </>
            )}
          </nav>

          <div className={`border-t border-border mt-auto pb-16 transition-all duration-300 ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
            <button
              onClick={handleLogout}
              aria-label={t('nav.logout')}
              className={`flex w-full items-center gap-3 rounded-lg py-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors mt-2 ${sidebarCollapsed ? 'justify-center px-2' : 'px-3'}`}
            >
              <LogOut size={18} className="shrink-0" />
              {!sidebarCollapsed && <span className="font-medium text-sm">{t('nav.logout')}</span>}
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside className={`fixed inset-y-0 left-0 w-64 border-r border-border bg-sidebar/95 backdrop-blur-xl flex flex-col z-40 md:hidden transition-transform duration-300 ease-in-out ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="h-16 flex items-center justify-between px-6 border-b border-border">
            <Link href={appConfig.startRoute} className="flex items-center gap-3 hover:opacity-80 transition-opacity" onClick={() => setMobileSidebarOpen(false)}>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg p-1 shadow-sm ${craftMode ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-card'}`}>
                {craftMode ? (
                  <Hammer className="h-5 w-5 text-amber-500" />
                ) : (
                  <img src="/icon-vfos.png" alt="Vibeforce Flow OS Logo" className="h-full w-full object-contain" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-foreground">{appConfig.appName}</span>
                {craftMode && <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Handwerk & Bau</span>}
              </div>
            </Link>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Menü schließen"
              className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {craftMode ? (
              <>
                <NavItem href="/craft" icon={<Hammer size={18} className="text-amber-500" />} label="Handwerks-Zentrale" active={pathname === '/craft' || pathname.startsWith('/craft/')} onClick={() => setMobileSidebarOpen(false)} />
                <NavItem href="/projects" icon={<FolderGit2 size={18} />} label="Baustellen & Bauvorhaben" active={pathname.startsWith('/projects')} onClick={() => setMobileSidebarOpen(false)} />
                <NavItem href="/clients" icon={<Building2 size={18} />} label="Bauherren & Auftraggeber (§ 13b & § 48b)" active={pathname.startsWith('/clients')} onClick={() => setMobileSidebarOpen(false)} />
                <NavItem href="/tasks" icon={<CheckSquare size={18} />} label="Mängel & Baustellen-Aufgaben" active={pathname === '/tasks'} onClick={() => setMobileSidebarOpen(false)} />
                <NavItem href="/time" icon={<Timer size={18} />} label="Monteur-Stempeluhr" active={pathname === '/time'} onClick={() => setMobileSidebarOpen(false)} />
                <NavItem href="/team" icon={<Users size={18} />} label="Monteure & Personal" active={pathname === '/team'} onClick={() => setMobileSidebarOpen(false)} />
                {user?.role === 'admin' && (
                  <NavItem href="/admin/users" icon={<Shield size={18} />} label={t('nav.admin')} active={pathname.startsWith('/admin')} onClick={() => setMobileSidebarOpen(false)} />
                )}
                <NavItem href="/notifications" icon={<Bell size={18} />} label={t('nav.notifications')} active={pathname === '/notifications'} onClick={() => setMobileSidebarOpen(false)} />
                <NavItem href="/docs" icon={<BookOpen size={18} />} label="VOB-Wissen & Dokumentation" active={pathname === '/docs'} onClick={() => setMobileSidebarOpen(false)} />
              </>
            ) : (
              <>
                <NavItem href="/" icon={<LayoutDashboard size={18} />} label={appConfig.navigation.dashboard || 'Dashboard'} active={pathname === '/'} onClick={() => setMobileSidebarOpen(false)} />
                <NavItem href="/tasks" icon={<CheckSquare size={18} />} label={t('nav.my_tasks')} active={pathname === '/tasks'} onClick={() => setMobileSidebarOpen(false)} />
                <NavItem href="/time" icon={<Timer size={18} />} label={t('nav.my_times')} active={pathname === '/time'} onClick={() => setMobileSidebarOpen(false)} />
                <NavItem href="/projects" icon={<FolderGit2 size={18} />} label={t('nav.projekte')} active={pathname.startsWith('/projects')} onClick={() => setMobileSidebarOpen(false)} />
                <NavItem href="/clients" icon={<Building2 size={18} />} label={t('nav.clients')} active={pathname.startsWith('/clients')} onClick={() => setMobileSidebarOpen(false)} />
                <NavItem href="/reports" icon={<TrendingUp size={18} />} label="Finanzen & Berichte" active={pathname.startsWith('/reports')} onClick={() => setMobileSidebarOpen(false)} />
                <NavItem href="/team" icon={<Users size={18} />} label={t('nav.team')} active={pathname === '/team'} onClick={() => setMobileSidebarOpen(false)} />
                {user?.role === 'admin' && (
                  <NavItem href="/admin/users" icon={<Shield size={18} />} label={t('nav.admin')} active={pathname.startsWith('/admin')} onClick={() => setMobileSidebarOpen(false)} />
                )}
                <NavItem href="/notifications" icon={<Bell size={18} />} label={t('nav.notifications')} active={pathname === '/notifications'} onClick={() => setMobileSidebarOpen(false)} />
                <NavItem href="/docs" icon={<BookOpen size={18} />} label={t('nav.docs')} active={pathname === '/docs'} onClick={() => setMobileSidebarOpen(false)} />
              </>
            )}
          </nav>

          <div className="p-4 border-t border-border mt-auto pb-16">
            <button
              onClick={() => { handleLogout(); setMobileSidebarOpen(false); }}
              aria-label={t('nav.logout')}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors mt-2"
            >
              <LogOut size={18} />
              <span className="font-medium text-sm">{t('nav.logout')}</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full relative overflow-hidden">
          {isOffline && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/15 border-b border-amber-500/30 text-amber-400 text-sm">
              <AlertTriangle size={16} />
              <span>Keine Verbindung — Daten werden lokal zwischengespeichert</span>
            </div>
          )}
          <header className="h-16 flex-shrink-0 flex items-center justify-between px-4 md:px-8 border-b border-border bg-background/80 backdrop-blur-md z-10">
            <div className="flex items-center gap-3 flex-1 md:flex-initial">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="md:hidden p-3 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
                aria-label={mobileSidebarOpen ? "Menü schließen" : "Menü öffnen"}
                aria-expanded={mobileSidebarOpen}
              >
                <Menu size={20} />
              </button>
              <div ref={searchRef} className="relative w-full max-w-96">
                <div className="flex items-center rounded-full bg-muted border border-border px-4 py-2 focus-within:border-primary/50 transition-colors">
                  {isSearching ? (
                    <Loader2 size={16} className="text-muted-foreground animate-spin" />
                  ) : (
                    <Search size={16} className="text-muted-foreground" />
                  )}
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={craftMode ? "Suchen nach Baustellen, Bauherren, Mängeln…" : "Suchen nach Projekten, Aufgaben…"}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={handleSearchFocus}
                    onKeyDown={handleSearchKeyDown}
                    className="bg-transparent border-none outline-none w-full ml-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:ring-0"
                  />
                  <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-accent/50 px-1.5 font-mono text-[11px] font-medium text-muted-foreground shrink-0">
                    /
                  </kbd>
                  {searchQuery && (
                    <button
                      onClick={() => { setSearchQuery(''); setSearchResults([]); setShowResults(false); }}
                      className="p-2 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                {showResults && (
                  <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border bg-popover shadow-2xl shadow-black/50 overflow-hidden z-50">
                    <div className="p-2 space-y-0.5">
                      {searchResults.map((result) => (
                        <Link
                          key={`${result.type}-${result.id}`}
                          href={result.href}
                          onClick={() => { setShowResults(false); setSearchQuery(''); }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors group"
                        >
                          <div className={`p-1.5 rounded-lg ${
                            result.type === 'project' ? 'bg-primary/10 text-primary' :
                            result.type === 'task' ? 'bg-emerald-500/10 text-emerald-400' :
                            result.type === 'client' ? 'bg-indigo-500/10 text-indigo-400' :
                            'bg-amber-500/10 text-amber-400'
                          }`}>
                            {result.type === 'project' ? <FolderGit2 size={14} /> :
                             result.type === 'task' ? <CheckSquare size={14} /> :
                             result.type === 'client' ? <Building2 size={14} /> :
                             <Users size={14} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground group-hover:text-foreground truncate font-medium">{result.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="border-t border-border/50 px-3 py-2 text-center">
                      <span className="text-xs text-muted-foreground/50">
                        Enter drücken für alle Ergebnisse
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleDarkMode}
                className="relative p-3 min-h-[44px] min-w-[44px] rounded-lg transition-all text-muted-foreground hover:text-foreground hover:bg-accent"
                aria-label={darkMode ? 'Helles Design aktivieren' : 'Dunkles Design aktivieren'}
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <LiveClock />
              <HeaderTimer />
              <button
                onClick={() => useUiStore.getState().toggleActionMenu()}
                className="relative p-3 min-h-[44px] min-w-[44px] rounded-lg transition-all text-amber-500 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 hover:text-amber-400"
                aria-label="Schnellaktionen öffnen"
              >
                <Zap size={18} />
              </button>
              <NotificationBell />
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-3 pl-4 border-l border-border cursor-pointer hover:opacity-80 transition-opacity"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-foreground">{getUserDisplayName(user)}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{user?.role || 'Mitglied'}</p>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center font-bold shadow-lg text-white">
                    {getUserInitials(user) || 'V'}
                  </div>
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-popover shadow-2xl z-50 overflow-hidden">
                      <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border">
                        Mein Konto
                      </div>
                      <div className="p-1">
                        <button
                          onClick={() => { router.push('/profile'); setUserMenuOpen(false); }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                        >
                          <UserCircle size={16} className="text-muted-foreground" />
                          Profil
                        </button>
                        <button
                          onClick={() => { router.push('/docs'); setUserMenuOpen(false); }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                        >
                          <BookOpen size={16} className="text-muted-foreground" />
                          Handbuch & Hilfe
                        </button>
                        {user?.role === 'admin' && (
                          <>
                            <button
                              onClick={() => { router.push('/admin/users'); setUserMenuOpen(false); }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                            >
                              <Users size={16} className="text-muted-foreground" />
                              Benutzerverwaltung
                            </button>
                            <button
                              onClick={() => { router.push('/admin/settings'); setUserMenuOpen(false); }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                            >
                              <Settings size={16} className="text-muted-foreground" />
                              System-Einstellungen
                            </button>
                          </>
                        )}
                      </div>
                      <div className="border-t border-border p-1">
                        <button
                          onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <LogOut size={16} />
                          Abmelden
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto pb-20">
            {children}
          </div>
        </main>
        <MobileTabBar />
        <SimpleActionMenu />
      </div>

      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle size={20} className="text-destructive" />
              Wirklich abmelden?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-1">
              Du wirst abgemeldet und musst dich danach erneut anmelden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLogoutOpen(false)}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={confirmLogout}
            >
              <LogOut size={16} className="mr-2" />
              Abmelden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <NewSimpleTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        onTaskCreated={() => router.refresh()}
      />
      <NewProjectDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        onProjectCreated={() => router.refresh()}
      />
      <NewClientDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        onClientCreated={() => router.refresh()}
      />
    </SidebarProvider>
  );
}

function NavItem({ icon, label, href, active, onClick, collapsed }: { icon: React.ReactNode, label: string, href: string, active: boolean, onClick?: () => void, collapsed?: boolean }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? label : undefined}
      className={`flex w-full items-center gap-3 rounded-lg py-2.5 transition-all ${active
        ? 'bg-primary/10 text-primary font-semibold'
        : 'text-muted-foreground hover:bg-accent hover:text-foreground font-medium'
        } ${collapsed ? 'justify-center px-2' : 'px-3'}`}
    >
      <div className="shrink-0">{icon}</div>
      {!collapsed && <span className="text-sm truncate transition-all duration-300">{label}</span>}
    </Link>
  );
}
