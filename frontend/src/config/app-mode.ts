/**
 * Vibeforce One — Central App-Mode Configuration
 * Controls whether the instance runs in 'craft' (Handwerk/Bau) or 'agency' (Digital/Agentur) mode.
 * Single Engine, Zero Duplication Architecture.
 */

export type AppMode = 'craft' | 'agency';

/**
 * Detects whether a given hostname belongs to Craft OS.
 * Matches craft.*, handwerk.*, craft-os.*, or custom preview hostnames.
 */
export function detectModeFromHostname(host?: string | null): AppMode {
  if (!host) return 'agency';
  const h = host.toLowerCase().trim();
  if (
    h.startsWith('craft.') ||
    h.startsWith('handwerk.') ||
    h.includes('craft-os') ||
    h.includes('.craft.') ||
    h.includes('craft-') ||
    h === 'craft'
  ) {
    return 'craft';
  }
  return 'agency';
}

/**
 * Returns the active application mode.
 * Evaluates:
 * 1. Explicit host argument (SSR headers)
 * 2. Client-side window.location.hostname (craft.* / handwerk.* -> 'craft')
 * 3. Local development override (localStorage)
 * 4. NEXT_PUBLIC_APP_MODE env variable (default: 'agency')
 * Deterministic for SSR and production builds (Zero Hydration Mismatch).
 */
export function getAppMode(explicitHost?: string | null): AppMode {
  // 1. Explicit Host (e.g. from SSR headers or server caller)
  if (explicitHost) {
    const hostMode = detectModeFromHostname(explicitHost);
    if (hostMode === 'craft') return 'craft';
  }

  // 2. Client-side Hostname Detection in Browser
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const hostMode = detectModeFromHostname(window.location.hostname);
    if (hostMode === 'craft') {
      return 'craft';
    }
  }

  // 3. Local Development Only: Allow developer to toggle modes via console
  if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
    const override = localStorage.getItem('vibeforce_app_mode_override') as AppMode | null;
    if (override === 'craft' || override === 'agency') {
      return override;
    }
  }

  // 4. Production & SSR: Deterministic build-time / container env variable
  const envMode = process.env.NEXT_PUBLIC_APP_MODE?.toLowerCase().trim();
  if (envMode === 'craft') {
    return 'craft';
  }
  return 'agency';
}

export function isCraftMode(explicitHost?: string | null): boolean {
  return getAppMode(explicitHost) === 'craft';
}

export function isAgencyMode(explicitHost?: string | null): boolean {
  return getAppMode(explicitHost) === 'agency';
}

/**
 * Isolated Cookie Name per Stack to prevent session collisions on shared domains (e.g. vercel.app).
 * Flow OS: 'pb_auth_flow'
 * Craft OS: 'pb_auth_craft'
 */
export function getAuthCookieName(explicitHost?: string | null): string {
  return isCraftMode(explicitHost) ? 'pb_auth_craft' : 'pb_auth_flow';
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

export function getAppConfig(explicitHost?: string | null): AppConfig {
  const mode = getAppMode(explicitHost);

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
