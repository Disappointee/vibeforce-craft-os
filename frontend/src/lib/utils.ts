import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * getDisplayValue — Sicherheitsfunktion gegen das unbeabsichtigte Anzeigen von IDs.
 * IMMER nutzen wenn ein lesbarer Wert aus einer Liste mit ID+Name/Title/E-Mail dargestellt wird.
 * Fallback-Chain: name → title → email → '(kein Name)' — NIEMALS die raw ID.
 * 
 * @example
 * const user = users.find(u => u.id === selectedId);
 * <span>{getDisplayValue(user)}</span>  // "Robin Lehnebach" statt "abc123"
 */
export function getDisplayValue(
  item: { id: string; name?: string | null; title?: string | null; email?: string | null } | null | undefined,
): string {
  if (!item) return 'Nicht zugewiesen';
  return item.name || item.title || item.email || '(kein Name)';
}

/** Decodes German HTML entities (&auml; → ä etc.) from PocketBase seed data. SSR-safe. */
export function decodeGermanHtmlEntities(text: string): string {
  if (!text) return text
  return text
    .replace(/&auml;/g, "ä")
    .replace(/&ouml;/g, "ö")
    .replace(/&uuml;/g, "ü")
    .replace(/&Auml;/g, "Ä")
    .replace(/&Ouml;/g, "Ö")
    .replace(/&Uuml;/g, "Ü")
    .replace(/&szlig;/g, "ß")
    .replace(/&amp;/g, "&")
}

/**
 * Safely normalizes and formats a site address from PocketBase.
 * Handles:
 * - null / undefined / empty string -> ''
 * - raw string -> trimmed string
 * - double-serialized JSON strings (e.g. '{"street":"Musterstr. 3"}') -> parsed and formatted
 * - object { street, zip, city, country } -> formatted as "street, zip city" (with numeric/string coercion)
 * Prevents React Error #31 (Objects are not valid as a React child).
 */
export function formatSiteAddress(addr: unknown): string {
  if (!addr) return '';
  if (typeof addr === 'string') {
    const trimmed = addr.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        return formatSiteAddress(JSON.parse(trimmed));
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }
  if (typeof addr === 'object' && !Array.isArray(addr)) {
    const a = addr as Record<string, unknown>;
    const street = typeof a.street === 'string' || typeof a.street === 'number' ? String(a.street).trim() : '';
    const zip = typeof a.zip === 'string' || typeof a.zip === 'number' ? String(a.zip).trim() : '';
    const city = typeof a.city === 'string' || typeof a.city === 'number' ? String(a.city).trim() : '';
    const cityLine = [zip, city].filter(Boolean).join(' ');
    return [street, cityLine].filter(Boolean).join(', ');
  }
  return '';
}

/**
 * Returns YYYY-MM-DD in local system timezone (Europe/Berlin safe).
 * Prevents UTC day shift around midnight.
 */
export function formatLocalDate(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

