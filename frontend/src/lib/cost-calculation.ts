/**
 * Kaufmännische Soll/Ist-Nachkalkulation & Margen-Engine (M007.2)
 *
 * Berechnung von:
 * - Soll- vs. Ist-Stunden mit VOB/B § 2 Abs. 3 Mehrkosten-Schranke (>10% Abweichung)
 * - Deckungsbeitrag I (DB I = Erlöse - Material/Fremdkosten)
 * - Deckungsbeitrag II (DB II = DB I - Lohnkosten)
 * - Margen (% bezogen auf Erlöse)
 * - Qualifikations-Kostenaufteilung (Meister, Geselle, Helfer, Azubi)
 */

import type { QualificationLevel } from './constants';
import type { ProjectRecord, SiteReportRecord, TimeEntryRecord } from './pocketbase-types';

export interface CostRates {
  meister: number;     // kalkulatorischer Stundenverrechnungssatz Meister (€/h)
  geselle: number;     // Geselle (€/h)
  helfer: number;      // Helfer / Fachwerker (€/h)
  azubi: number;       // Auszubildender (€/h)
  defaultRate: number; // Fallback für Monteure ohne Qualifikationsangabe (€/h)
}

export const DEFAULT_COST_RATES: CostRates = {
  meister: 68.0,
  geselle: 52.0,
  helfer: 38.0,
  azubi: 25.0,
  defaultRate: 50.0,
};

export interface QualificationHoursSummary {
  hours: number;
  cost: number;
  rate: number;
}

export type ProfitMarginStatus = 'healthy' | 'warning' | 'critical';

export interface ProjectCostSummary {
  projectId: string;
  projectName: string;

  // Stunden-Kennzahlen
  sollHours: number;
  istHours: number;
  hoursDelta: number;               // sollHours - istHours (positiv = Reststunden, negativ = Überhang)
  hoursBurnupPercent: number;       // (istHours / sollHours) * 100
  isOverrun: boolean;               // istHours > sollHours
  isVobOverrun: boolean;            // istHours > sollHours * 1.10 (VOB/B § 2 Abs. 3)
  vobOverrunPercent: number;        // Prozentuale Überschreitung über 100%

  // Erlöse
  sollRevenue: number;              // Geplante Auftragssumme / budget_money
  istRevenue: number;               // Abgerechnete Erlöse (Rechnungen oder Aufmaß)
  effectiveRevenue: number;         // Basis für Margen-Berechnung (istRevenue falls >0, sonst sollRevenue)

  // Kosten & Deckungsbeiträge
  materialAndExternalCosts: number; // Fremd- und Materialkosten (external_costs_total)
  deckungsbeitrag1: number;         // effectiveRevenue - materialAndExternalCosts
  deckungsbeitrag1MarginPercent: number; // (DB I / effectiveRevenue) * 100

  laborCosts: number;               // Berechnete Lohnkosten aller Stunden
  deckungsbeitrag2: number;         // DB I - laborCosts (Reingewinn vor Steuern)
  deckungsbeitrag2MarginPercent: number; // (DB II / effectiveRevenue) * 100
  profitMarginStatus: ProfitMarginStatus; // 'healthy' (>20%), 'warning' (5-20%), 'critical' (<5%)

  // Detail-Aufschlüsselungen
  qualificationHoursBreakdown: Record<QualificationLevel, QualificationHoursSummary>;
  monteurHours: number;             // Stunden aus time_entries
  regieHours: number;               // Stunden aus site_reports
  monteurTimeEntriesCount: number;
  siteReportsCount: number;
  costRatesUsed: CostRates;
}

export interface CalculationInput {
  project: ProjectRecord;
  timeEntries?: TimeEntryRecord[];
  siteReports?: SiteReportRecord[];
  invoices?: Array<{ net_total?: number; gross_total?: number }>;
  customCostRates?: Partial<CostRates>;
  plannedBoqNetTotal?: number;
}

/**
 * Berechnet die vollständige kaufmännische Soll/Ist-Nachkalkulation für ein Projekt.
 * Deterministisch, cent-genau gerundet, sicher gegen Null-Division.
 */
export function calculateProjectCostSummary(input: CalculationInput): ProjectCostSummary {
  const {
    project,
    timeEntries = [],
    siteReports = [],
    invoices = [],
    customCostRates = {},
    plannedBoqNetTotal,
  } = input;

  const costRates: CostRates = {
    ...DEFAULT_COST_RATES,
    ...customCostRates,
  };

  // 1. Soll-Kennzahlen aus Projekt oder GAEB-LV
  const sollHours = Math.max(0, project.budget_hours || 0);
  const sollRevenue = Math.max(0, plannedBoqNetTotal || project.budget_money || 0);
  const materialAndExternalCosts = Math.max(0, project.external_costs_total || 0);

  // 2. Erlöse (Ist) aus Rechnungen oder Aufmaß
  const invoiceNetSum = invoices.reduce((sum, inv) => sum + (inv.net_total || 0), 0);
  const istRevenue = Math.round(invoiceNetSum * 100) / 100;
  const effectiveRevenue = istRevenue > 0 ? istRevenue : sollRevenue;

  // 3. Stunden aus Zeiterfassung (Monteur-Stempelungen)
  let monteurHours = 0;
  let monteurLaborCost = 0;

  for (const entry of timeEntries) {
    // duration_minutes bevorzugen, sonst duration in Stunden
    const durationH = entry.duration_minutes !== undefined && entry.duration_minutes !== null
      ? entry.duration_minutes / 60
      : (entry.duration || 0);

    monteurHours += durationH;

    // Nutzer-Stundensatz oder Default-Rate
    const userRate = (entry as any).expand?.user?.hourly_rate || costRates.defaultRate;
    monteurLaborCost += durationH * userRate;
  }

  // 4. Stunden aus Bautagesberichten (Regiestunden nach Qualifikation)
  const qualificationHoursBreakdown: Record<QualificationLevel, QualificationHoursSummary> = {
    meister: { hours: 0, cost: 0, rate: costRates.meister },
    geselle: { hours: 0, cost: 0, rate: costRates.geselle },
    helfer: { hours: 0, cost: 0, rate: costRates.helfer },
    azubi: { hours: 0, cost: 0, rate: costRates.azubi },
  };

  let regieHours = 0;

  for (const rep of siteReports) {
    if (rep.qualification_hours) {
      for (const level of ['meister', 'geselle', 'helfer', 'azubi'] as QualificationLevel[]) {
        const h = rep.qualification_hours[level] || 0;
        if (h > 0) {
          qualificationHoursBreakdown[level].hours += h;
          regieHours += h;
        }
      }
    }
  }

  // Kosten für Qualifikationsstunden berechnen
  let regieLaborCost = 0;
  for (const level of ['meister', 'geselle', 'helfer', 'azubi'] as QualificationLevel[]) {
    const summary = qualificationHoursBreakdown[level];
    summary.hours = Math.round(summary.hours * 100) / 100;
    summary.cost = Math.round(summary.hours * summary.rate * 100) / 100;
    regieLaborCost += summary.cost;
  }

  // 5. Konsolidierte Stunden
  const totalIstHours = Math.round((monteurHours + regieHours) * 100) / 100;
  const hoursDelta = Math.round((sollHours - totalIstHours) * 100) / 100;
  const hoursBurnupPercent = sollHours > 0
    ? Math.round((totalIstHours / sollHours) * 1000) / 10
    : 0;

  const isOverrun = totalIstHours > sollHours && sollHours > 0;
  const isVobOverrun = sollHours > 0 && totalIstHours > sollHours * 1.10;
  const vobOverrunPercent = sollHours > 0 && isOverrun
    ? Math.round(((totalIstHours - sollHours) / sollHours) * 1000) / 10
    : 0;

  // 6. Personalkosten & Deckungsbeiträge
  const totalLaborCosts = Math.round((monteurLaborCost + regieLaborCost) * 100) / 100;

  // DB I = Erlöse - Material/Fremdkosten
  const deckungsbeitrag1 = Math.round((effectiveRevenue - materialAndExternalCosts) * 100) / 100;
  const deckungsbeitrag1MarginPercent = effectiveRevenue > 0
    ? Math.round((deckungsbeitrag1 / effectiveRevenue) * 1000) / 10
    : 0;

  // DB II = DB I - Lohnkosten
  const deckungsbeitrag2 = Math.round((deckungsbeitrag1 - totalLaborCosts) * 100) / 100;
  const deckungsbeitrag2MarginPercent = effectiveRevenue > 0
    ? Math.round((deckungsbeitrag2 / effectiveRevenue) * 1000) / 10
    : 0;

  // Margenstatus
  let profitMarginStatus: ProfitMarginStatus = 'healthy';
  if (deckungsbeitrag2MarginPercent < 5) {
    profitMarginStatus = 'critical';
  } else if (deckungsbeitrag2MarginPercent < 20) {
    profitMarginStatus = 'warning';
  }

  return {
    projectId: project.id,
    projectName: project.name,
    sollHours,
    istHours: totalIstHours,
    hoursDelta,
    hoursBurnupPercent,
    isOverrun,
    isVobOverrun,
    vobOverrunPercent,
    sollRevenue,
    istRevenue,
    effectiveRevenue,
    materialAndExternalCosts,
    deckungsbeitrag1,
    deckungsbeitrag1MarginPercent,
    laborCosts: totalLaborCosts,
    deckungsbeitrag2,
    deckungsbeitrag2MarginPercent,
    profitMarginStatus,
    qualificationHoursBreakdown,
    monteurHours: Math.round(monteurHours * 100) / 100,
    regieHours: Math.round(regieHours * 100) / 100,
    monteurTimeEntriesCount: timeEntries.length,
    siteReportsCount: siteReports.length,
    costRatesUsed: costRates,
  };
}
