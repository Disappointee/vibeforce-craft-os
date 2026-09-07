/**
 * Vibeforce One — Central App-Mode Configuration
 * Controls whether the instance runs in 'craft' (Handwerk/Bau) or 'agency' (Digital/Agentur) mode.
 * Single Engine, Zero Duplication Architecture.
 */

export type AppMode = 'craft' | 'agency';

/**
 * Returns the active application mode.
 * Evaluates NEXT_PUBLIC_APP_MODE (default: 'agency').
 * In browser development, allows optional localStorage override for quick testing.
 */
export function getAppMode(): AppMode {
  // 1. Browser runtime: Dynamic Subdomain / Hostname detection
  // e.g. craft.vibeforce-flow-os.vercel.app, craft.meinedomain.de, craft.localhost
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname.toLowerCase();
    if (
      hostname.startsWith('craft.') ||
      hostname.startsWith('handwerk.') ||
      hostname.includes('craft-os') ||
      hostname.includes('.craft.')
    ) {
      return 'craft';
    }

    const override = localStorage.getItem('vibeforce_app_mode_override') as AppMode | null;
    if (override === 'craft' || override === 'agency') {
      return override;
    }
  }

  // 2. Build-time or server-side environment variable (Docker, Vercel Env)
  const envMode = process.env.NEXT_PUBLIC_APP_MODE?.toLowerCase().trim();
  if (envMode === 'craft') {
    return 'craft';
  }
  return 'agency';
}

export function isCraftMode(): boolean {
  return getAppMode() === 'craft';
}

export function isAgencyMode(): boolean {
  return getAppMode() === 'agency';
}

/**
 * Static domain configuration and label dictionary based on active AppMode.
 */
export interface AppConfig {
  mode: AppMode;
  appName: string;
  appShortName: string;
  appBadge: string;
  appTagline: string;
  startRoute: string;
  defaultEmailPlaceholder: string;
  accentColor: string;
  navigation: {
    dashboard: string;
    projects: string;
    projectSingular: string;
    clients: string;
    clientSingular: string;
    tasks: string;
    taskSingular: string;
    time: string;
    team: string;
    docs: string;
  };
}

export function getAppConfig(): AppConfig {
  const mode = getAppMode();

  if (mode === 'craft') {
    return {
      mode: 'craft',
      appName: 'Vibeforce Craft OS',
      appShortName: 'Craft OS',
      appBadge: 'Handwerk & Bau',
      appTagline: 'Das Handwerks- & Baustellen-Betriebssystem',
      startRoute: '/craft',
      defaultEmailPlaceholder: 'meister@handwerksbetrieb.de',
      accentColor: '#f59e0b', // Amber
      navigation: {
        dashboard: 'Handwerks-Zentrale',
        projects: 'Baustellen & Bauvorhaben',
        projectSingular: 'Baustelle',
        clients: 'Bauherren & Auftraggeber (§ 13b & § 48b)',
        clientSingular: 'Bauherr / Auftraggeber',
        tasks: 'Mängel & Baustellen-Aufgaben',
        taskSingular: 'Baustellen-Aufgabe',
        time: 'Monteur-Stempeluhr',
        team: 'Monteure & Personal',
        docs: 'VOB-Wissen & Dokumentation',
      },
    };
  }

  return {
    mode: 'agency',
    appName: 'Vibeforce Flow OS',
    appShortName: 'Flow OS',
    appBadge: 'Agentur & Digital',
    appTagline: 'The Agency Operating System',
    startRoute: '/',
    defaultEmailPlaceholder: 'name@agentur.de',
    accentColor: '#0d9488', // Teal
    navigation: {
      dashboard: 'Dashboard',
      projects: 'Projekte',
      projectSingular: 'Projekt',
      clients: 'Kunden & CRM',
      clientSingular: 'Kunde',
      tasks: 'Meine Aufgaben',
      taskSingular: 'Aufgabe',
      time: 'Meine Zeiten',
      team: 'Team & Ressourcen',
      docs: 'Dokumentation',
    },
  };
}
