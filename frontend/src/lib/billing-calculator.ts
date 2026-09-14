import { BillingRoundingInterval, BillingRoundingMode } from './pocketbase-types';

export interface CalculateBillableOptions {
  rawMinutes: number;
  interval?: BillingRoundingInterval | null;
  mode?: BillingRoundingMode | null;
  isBillable?: boolean;
}

/**
 * Calculates billable minutes based on raw work time and contractual rounding settings.
 * Pure deterministic calculation without side effects.
 */
export function calculateBillableMinutes({
  rawMinutes,
  interval = 6,
  mode = 'ceil',
  isBillable = true,
}: CalculateBillableOptions): number {
  if (!isBillable || rawMinutes <= 0) {
    return 0;
  }

  const effectiveInterval = interval ?? 6;
  const effectiveMode = mode ?? 'ceil';

  // Exact mode (0 or 1 minute interval)
  if (effectiveInterval <= 1) {
    return Math.max(1, Math.round(rawMinutes));
  }

  if (effectiveMode === 'ceil') {
    return Math.max(effectiveInterval, Math.ceil(rawMinutes / effectiveInterval) * effectiveInterval);
  } else {
    // Round to nearest interval
    const rounded = Math.round(rawMinutes / effectiveInterval) * effectiveInterval;
    return Math.max(effectiveInterval, rounded);
  }
}

/**
 * Formats billable minutes into human readable format with decimal hours (e.g., "18m (0,3h)").
 */
export function formatBillingDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m (0,0h)';
  
  const hours = (minutes / 60).toFixed(1).replace('.', ',');
  return `${minutes}m (${hours}h)`;
}

export const ROUNDING_INTERVAL_OPTIONS: { value: BillingRoundingInterval; label: string; description: string }[] = [
  { value: 0, label: 'Exakt (1 Minute)', description: 'Minutengenaue Zeiterfassung ohne Rundung' },
  { value: 5, label: '5-Minuten-Takt', description: 'Gängiger Agentur-Takt für Micro-Tasks' },
  { value: 6, label: '6-Minuten-Takt (0,1h)', description: 'Industrie- & B2B-Standard für dezimale Stundensätze' },
  { value: 10, label: '10-Minuten-Takt', description: 'Guter Mittelweg für Support- & Ticketverträge' },
  { value: 15, label: '15-Minuten-Takt (0,25h)', description: 'Klassischer Viertelstundentakt' },
  { value: 30, label: '30-Minuten-Takt (0,5h)', description: 'Halbstundentakt für Vor-Ort- oder Pauschalleistungen' },
];

export const ROUNDING_MODE_OPTIONS: { value: BillingRoundingMode; label: string }[] = [
  { value: 'ceil', label: 'Immer aufrunden (Agentur-Standard)' },
  { value: 'round', label: 'Kaufmännisch runden (Nächste Schwelle)' },
];
