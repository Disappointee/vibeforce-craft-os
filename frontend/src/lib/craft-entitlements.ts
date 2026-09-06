import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CraftFeatureId =
  | 'reports'
  | 'measurements'
  | 'geofence'
  | 'invoices'
  | 'gaeb'
  | 'margin'
  | 'wholesale'
  | 'pinning';

export type CraftTierId = 'starter' | 'pro' | 'enterprise' | 'custom';

export interface CraftFeatureMetadata {
  id: CraftFeatureId;
  title: string;
  shortTitle: string;
  category: 'Basis' | 'Baustelle' | 'Finanzen' | 'Kalkulation' | 'Beschaffung';
  description: string;
  monthlyPrice: number;
  tier: 'starter' | 'pro' | 'enterprise';
  badgeText: string;
  roiPitch: string;
  highlights: string[];
}

export interface CraftTier {
  id: 'starter' | 'pro' | 'enterprise';
  name: string;
  tagline: string;
  monthlyPrice: number;
  popular?: boolean;
  includedFeatures: CraftFeatureId[];
}

/**
 * Commercial feature definitions with pricing and ROI value propositions.
 */
export const CRAFT_FEATURES: Record<CraftFeatureId, CraftFeatureMetadata> = {
  reports: {
    id: 'reports',
    title: 'Bautagesberichte & Regieberichte (VOB/B § 6)',
    shortTitle: 'Bautagesberichte',
    category: 'Basis',
    description: 'Lückenlose Dokumentation von Witterung, Personal, Baufortschritt und Behinderungen nach VOB/B § 6.',
    monthlyPrice: 0,
    tier: 'starter',
    badgeText: 'Kernmodul',
    roiPitch: 'Verhindert Baustopp-Verluste und schützt vor ungerechtfertigten Schadensersatzforderungen.',
    highlights: [
      'Rechtssichere Kausalitäts-Dokumentation gem. VOB/B § 6',
      'Wetter-, Temperatur- und Personal-Erfassung nach Gewerken',
      'GoBD-konforme Revisionssicherheit mit SHA-256 Fingerprint',
      'PDF-Bautagesbericht-Export mit 1 Klick',
    ],
  },
  measurements: {
    id: 'measurements',
    title: 'Digitales VOB-Aufmaß & DIN 18299',
    shortTitle: 'VOB-Aufmaß',
    category: 'Basis',
    description: 'Mathematisch exakte Aufmaß-Erfassung nach VOB Teil C mit automatischer § 13b Reverse-Charge Trennung.',
    monthlyPrice: 0,
    tier: 'starter',
    badgeText: 'Kernmodul',
    roiPitch: 'Verkürzt die Abrechnungszeit von Tagen auf Minuten und garantiert 100% abrechenbare Aufmaße.',
    highlights: [
      'Shunting-Yard Formelevaluation (L × B × H)',
      'Übermessungsregel DIN 18299 § 4 (< 2,5 m²)',
      'Automatische Steuersplittung: 19% Standard vs. 0% § 13b UStG',
      'Direkte Übergabe an Rechnungs- und Aufmaß-Exporte',
    ],
  },
  geofence: {
    id: 'geofence',
    title: 'GPS-Geofencing & Baustellenkarte',
    shortTitle: 'GPS-Geofencing',
    category: 'Baustelle',
    description: 'Automatischer Check-In vor Ort, Polygon-Geofences und DSGVO-konformer Kachel-Proxy.',
    monthlyPrice: 29,
    tier: 'pro',
    badgeText: 'Add-on Pro',
    roiPitch: 'Keine vergessenen Arbeitszeiten mehr auf der Baustelle — spart bis zu 5 ungebuchte Stunden pro Monteur.',
    highlights: [
      'Asymmetrische Hysterese (120s Check-in / 900s Haltedauer)',
      'DSGVO-konformer Kachel-Proxy (kein IP-Leakage zu Drittanbietern)',
      'Haptische Push-Vorschläge und Web-Audio Earcons bei Ankunft',
      'Outdoor High-Contrast Modus für Sonnenlicht-Ablesbarkeit',
    ],
  },
  invoices: {
    id: 'invoices',
    title: 'ZUGFeRD 2.1.1 E-Rechnung & DATEV EXTF 700',
    shortTitle: 'Rechnungen & DATEV',
    category: 'Finanzen',
    description: 'Gesetzeskonforme E-Rechnungen (EN 16931) für öffentliche Auftraggeber und automatischer DATEV-Export.',
    monthlyPrice: 39,
    tier: 'pro',
    badgeText: 'Add-on Pro',
    roiPitch: 'Erfüllt die E-Rechnungspflicht ab 2025 und spart Steuerberaterkosten durch automatische Vorkontierung.',
    highlights: [
      'UN/CEFACT D16B ZUGFeRD 2.1.1 / Factur-X XML-Engine',
      'Kumulierte VOB-Abschlagsrechnungen (BT-113)',
      'Gerichtsfeste biometrische Unterschrift (§ 127 BGB / § 439 ZPO)',
      'DATEV EXTF 700 Buchungsstapel (SKR03 / SKR04 Vorkontierung)',
    ],
  },
  gaeb: {
    id: 'gaeb',
    title: 'GAEB XML-Engine (X83 Import & X84 Angebotsabgabe)',
    shortTitle: 'GAEB / LV (X83/X84)',
    category: 'Kalkulation',
    description: 'Normkonformer Import von Architekten-Leistungsverzeichnissen und fehlerfreie X84-Angebotsabgabe.',
    monthlyPrice: 49,
    tier: 'enterprise',
    badgeText: 'Add-on Enterprise',
    roiPitch: 'Gewinnen Sie mehr Ausschreibungen — 80% Zeitersparnis bei der Kalkulation umfangreicher LVs.',
    highlights: [
      'GAEB DA XML 3.2 & 3.3 Parser für .x83 und .d83 Dateien',
      'Interaktive Einheitspreis-Kalkulation mit Gewerke-Zwischensummen',
      'Export als normkonforme .x84 Datei für Architekten und Vergabeportale',
      '1-Klick-Brücke: LV-Positionen direkt in das VOB-Aufmaß übernehmen',
    ],
  },
  margin: {
    id: 'margin',
    title: 'Soll/Ist-Nachkalkulation & Margen-Cockpit',
    shortTitle: 'Nachkalkulation & Margen',
    category: 'Kalkulation',
    description: 'Live Deckungsbeitrags-Berechnung (DB I & DB II) und VOB/B § 2 Abs. 3 Mehrkosten-Schranke.',
    monthlyPrice: 49,
    tier: 'enterprise',
    badgeText: 'Add-on Enterprise',
    roiPitch: 'Erkennt drohende Defizite schon während der Bauphase und schützt Ihre Marge vor unbemerkten Überhängen.',
    highlights: [
      'Echtzeit-Gegenüberstellung: LV-Soll-Budget vs. gestempelte Monteur-Zeiten',
      'Deckungsbeitrag I (Rohertrag) und Deckungsbeitrag II (nach Lohnkosten)',
      'VOB/B § 2 Abs. 3 Schranke (>10% Mehrkostenwarnung mit Nachforderungsanspruch)',
      'Betrieblicher Verrechnungssatz-Editor pro Qualifikation (Meister/Geselle/etc.)',
    ],
  },
  wholesale: {
    id: 'wholesale',
    title: 'Großhandels-Kataloge (DATANORM 5.0 & IDS-Connect 2.5)',
    shortTitle: 'Großhandel & DATANORM',
    category: 'Beschaffung',
    description: 'Direktanbindung an Großhändler (GC-ONLINE, Sonepar, R+F) und Einkaufspreis-Pflege.',
    monthlyPrice: 59,
    tier: 'enterprise',
    badgeText: 'Add-on Enterprise',
    roiPitch: 'Kalkulieren Sie immer mit tagesaktuellen Großhandels-EKs und vermeiden Sie manuelle Artikel-Abtippfehler.',
    highlights: [
      'DATANORM 5.0 & 4.0 Import mit DOS CP850/UTF-8 Charset-Garantie',
      'IDS-Connect 2.5 Punchout: Direkte Warenkorb-Übernahme aus Fachgroßhandels-Shops',
      'Dynamischer Margen-Kalkulator mit Handwerker-Aufschlag auf EK',
      '1-Klick-Übernahme ausgewählter Artikel direkt ins VOB-Aufmaß & GAEB-LV',
    ],
  },
  pinning: {
    id: 'pinning',
    title: '2D-Plan-Pinning & VOB/B § 13 Mängelmanagement',
    shortTitle: 'Plan-Pinning & Mängel',
    category: 'Baustelle',
    description: 'Grundriss-Viewer mit punktgenauen Mängel-Stecknadeln und formalen Mängelrügen.',
    monthlyPrice: 49,
    tier: 'enterprise',
    badgeText: 'Demnächst (Phase 4)',
    roiPitch: 'Verhindert Gewährleistungsstreitigkeiten und dokumentiert Nachbesserungen mit Fristsetzung.',
    highlights: [
      'Interaktiver 2D-Grundriss-Viewer mit Zoom & Pan',
      'Punktgenaues Pin-Setzen mit Gewerk, Fristdatum und Beweisfoto',
      'Formelle Mängelrüge gem. VOB/B § 13 Abs. 5 mit Androhung von Ersatzvornahme',
      'Rechtssicherer Status-Workflow von Erfassung bis Endabnahme',
    ],
  },
};

/**
 * Predefined Commercial Tier Bundles.
 */
export const CRAFT_TIERS: CraftTier[] = [
  {
    id: 'starter',
    name: 'Craft Starter',
    tagline: 'Das solide Fundament für Bautagesberichte & VOB-Aufmaß',
    monthlyPrice: 0,
    includedFeatures: ['reports', 'measurements'],
  },
  {
    id: 'pro',
    name: 'Craft Professional',
    tagline: 'Für wachsende Handwerksbetriebe mit GPS-Zeiterfassung & E-Rechnung',
    monthlyPrice: 59,
    popular: true,
    includedFeatures: ['reports', 'measurements', 'geofence', 'invoices'],
  },
  {
    id: 'enterprise',
    name: 'Craft Enterprise Handwerk',
    tagline: 'Die schlüsselfertige Gesamtlösung inkl. GAEB, Margen-Cockpit & Großhandel',
    monthlyPrice: 199,
    includedFeatures: [
      'reports',
      'measurements',
      'geofence',
      'invoices',
      'gaeb',
      'margin',
      'wholesale',
    ],
  },
];

interface CraftEntitlementsState {
  enabledFeatures: Record<CraftFeatureId, boolean>;
  activeTier: CraftTierId;
  projectOverrides: Record<string, Partial<Record<CraftFeatureId, boolean>>>;

  // Actions
  toggleFeature: (featureId: CraftFeatureId, enabled?: boolean) => void;
  applyTier: (tierId: 'starter' | 'pro' | 'enterprise') => void;
  setProjectOverride: (
    projectId: string,
    featureId: CraftFeatureId,
    enabled: boolean
  ) => void;
  clearProjectOverrides: (projectId: string) => void;
  isFeatureEnabled: (featureId: CraftFeatureId, projectId?: string) => boolean;
  calculateMonthlyTotal: (projectId?: string) => number;
  resetToDefaults: () => void;
}

const DEFAULT_ENABLED_FEATURES: Record<CraftFeatureId, boolean> = {
  reports: true,
  measurements: true,
  geofence: true,
  invoices: true,
  gaeb: true,
  margin: true,
  wholesale: true,
  pinning: false, // Phase 4
};

export const useCraftEntitlementsStore = create<CraftEntitlementsState>()(
  persist(
    (set, get) => ({
      enabledFeatures: { ...DEFAULT_ENABLED_FEATURES },
      activeTier: 'enterprise',
      projectOverrides: {},

      toggleFeature: (featureId, enabled) => {
        set((state) => {
          const current = state.enabledFeatures[featureId];
          const next = enabled !== undefined ? enabled : !current;
          const updated = {
            ...state.enabledFeatures,
            [featureId]: next,
          };

          // Determine if matching an existing tier
          let nextTier: CraftTierId = 'custom';
          for (const tier of CRAFT_TIERS) {
            const matchesTier =
              tier.includedFeatures.every((f) => updated[f]) &&
              Object.keys(updated).every(
                (f) =>
                  !updated[f as CraftFeatureId] ||
                  tier.includedFeatures.includes(f as CraftFeatureId)
              );
            if (matchesTier) {
              nextTier = tier.id;
              break;
            }
          }

          return {
            enabledFeatures: updated,
            activeTier: nextTier,
          };
        });
      },

      applyTier: (tierId) => {
        const tier = CRAFT_TIERS.find((t) => t.id === tierId);
        if (!tier) return;

        const updated: Record<CraftFeatureId, boolean> = {
          reports: false,
          measurements: false,
          geofence: false,
          invoices: false,
          gaeb: false,
          margin: false,
          wholesale: false,
          pinning: false,
        };

        tier.includedFeatures.forEach((f) => {
          updated[f] = true;
        });

        set({
          enabledFeatures: updated,
          activeTier: tierId,
        });
      },

      setProjectOverride: (projectId, featureId, enabled) => {
        set((state) => {
          const existing = state.projectOverrides[projectId] || {};
          return {
            projectOverrides: {
              ...state.projectOverrides,
              [projectId]: {
                ...existing,
                [featureId]: enabled,
              },
            },
          };
        });
      },

      clearProjectOverrides: (projectId) => {
        set((state) => {
          const updated = { ...state.projectOverrides };
          delete updated[projectId];
          return { projectOverrides: updated };
        });
      },

      isFeatureEnabled: (featureId, projectId) => {
        const state = get();
        if (projectId && state.projectOverrides[projectId]?.[featureId] !== undefined) {
          return Boolean(state.projectOverrides[projectId]![featureId]);
        }
        return Boolean(state.enabledFeatures[featureId]);
      },

      calculateMonthlyTotal: (projectId) => {
        const state = get();
        const features = Object.keys(CRAFT_FEATURES) as CraftFeatureId[];
        let total = 0;

        for (const f of features) {
          if (state.isFeatureEnabled(f, projectId)) {
            total += CRAFT_FEATURES[f].monthlyPrice;
          }
        }
        return total;
      },

      resetToDefaults: () => {
        set({
          enabledFeatures: { ...DEFAULT_ENABLED_FEATURES },
          activeTier: 'enterprise',
          projectOverrides: {},
        });
      },
    }),
    {
      name: 'vibeforce-craft-entitlements',
    }
  )
);
