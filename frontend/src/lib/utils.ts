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
