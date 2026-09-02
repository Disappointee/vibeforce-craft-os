'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Trash2, Plus, Calculator } from 'lucide-react';
import { MEASUREMENT_UNITS, MEASUREMENT_UNIT_LABEL_MAP, labelFor } from '@/lib/constants';
import type { MeasurementRecord, MeasurementUnit } from '@/lib/pocketbase-types';

export interface MeasurementRowItem {
  id: string;
  position_nr: string;
  title: string;
  formula: string;
  quantity: number;
  unit: MeasurementUnit;
  unit_price: number;
  total_price: number;
  notes?: string;
}

interface MeasurementGridProps {
  initialItems?: MeasurementRowItem[];
  onChange?: (items: MeasurementRowItem[]) => void;
  readOnly?: boolean;
  isReverseCharge?: boolean;
}

const SAFE_EXPR_REGEX = /^[\d+\-*/().,\s]+$/;

function safeEval(expr: string): number {
  const trimmed = expr.trim();
  if (!trimmed) return 0;
  if (!SAFE_EXPR_REGEX.test(trimmed)) {
    return 0;
  }
  try {
    // German decimal commas support: "14,5 * 8,2" -> "14.5 * 8.2"
    const normalized = trimmed.replace(/,/g, '.');
    const fn = new Function(`'use strict'; return (${normalized})`);
    const res = fn();
    return typeof res === 'number' && Number.isFinite(res) ? Math.round(res * 1000) / 1000 : 0;
  } catch {
    return 0;
  }
}

function generatePosNr(index: number): string {
  const seq = String(index + 1).padStart(2, '0');
  return `01.${seq}`;
}

function generateId(): string {
  return 'temp_' + Math.random().toString(36).substring(2, 9);
}

export function MeasurementGrid({
  initialItems,
  onChange,
  readOnly = false,
  isReverseCharge = false,
}: MeasurementGridProps) {
  const [rows, setRows] = useState<MeasurementRowItem[]>(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems;
    }
    return [
      {
        id: generateId(),
        position_nr: generatePosNr(0),
        title: '',
        formula: '',
        quantity: 0,
        unit: 'm2',
        unit_price: 0,
        total_price: 0,
      },
    ];
  });

  const updateRow = useCallback((id: string, updates: Partial<MeasurementRowItem>) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const merged = { ...row, ...updates };

        // Recalculate quantity if formula updated
        if (updates.formula !== undefined) {
          const trimmed = updates.formula.trim();
          if (!trimmed) {
            merged.quantity = 0;
          } else {
            const evalQty = safeEval(trimmed);
            merged.quantity = evalQty;
          }
        }

        const safeQty = typeof merged.quantity === 'number' && !isNaN(merged.quantity) ? merged.quantity : 0;
        const safePrice = typeof merged.unit_price === 'number' && !isNaN(merged.unit_price) ? merged.unit_price : 0;
        merged.total_price = Math.round(safeQty * safePrice * 100) / 100;
        return merged;
      })
    );
  }, []);

  const addRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      {
        id: generateId(),
        position_nr: generatePosNr(prev.length),
        title: '',
        formula: '',
        quantity: 0,
        unit: 'm2',
        unit_price: 0,
        total_price: 0,
      },
    ]);
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows((prev) => {
      const filtered = prev.filter((r) => r.id !== id);
      return filtered.map((r, idx) => ({ ...r, position_nr: generatePosNr(idx) }));
    });
  }, []);

  useEffect(() => {
    onChange?.(rows);
  }, [rows, onChange]);

  const subtotal = useMemo(
    () => rows.reduce((sum, r) => sum + (r.total_price || 0), 0),
    [rows]
  );
  const taxRate = isReverseCharge ? 0 : 0.19;
  const tax = useMemo(() => (isReverseCharge ? 0 : Math.round(subtotal * taxRate * 100) / 100), [subtotal, isReverseCharge, taxRate]);
  const total = useMemo(() => (isReverseCharge ? subtotal : Math.round((subtotal + tax) * 100) / 100), [subtotal, tax, isReverseCharge]);

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-teal-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            VOB-Aufmaß & Leistungspositionen
          </h3>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Position hinzufügen
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121824] shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50/75 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-3 w-16">Pos.</th>
              <th className="py-3 px-3 min-w-[200px]">Bezeichnung / Leistung</th>
              <th className="py-3 px-3 min-w-[160px]">Formel (L × B × H)</th>
              <th className="py-3 px-3 w-24">Menge</th>
              <th className="py-3 px-3 w-28">Einheit</th>
              <th className="py-3 px-3 w-28">EP (€)</th>
              <th className="py-3 px-3 w-28 text-right">GP (€)</th>
              {!readOnly && <th className="py-3 px-2 w-10 text-center"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-900 dark:text-gray-200">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors">
                <td className="py-2.5 px-3 font-mono font-medium text-gray-500">
                  {row.position_nr}
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="text"
                    value={row.title}
                    disabled={readOnly}
                    onChange={(e) => updateRow(row.id, { title: e.target.value })}
                    placeholder="z.B. Estrich verlegen"
                    className="w-full bg-transparent border-0 focus:ring-1 focus:ring-teal-500 rounded px-1.5 py-1 text-xs"
                  />
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="text"
                    value={row.formula}
                    disabled={readOnly}
                    onChange={(e) => updateRow(row.id, { formula: e.target.value })}
                    placeholder="z.B. 4.5 * 3.2 * 0.1"
                    className="w-full bg-transparent font-mono border-0 focus:ring-1 focus:ring-teal-500 rounded px-1.5 py-1 text-xs text-teal-600 dark:text-teal-400 placeholder-gray-400"
                  />
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="number"
                    step="any"
                    value={row.quantity || ''}
                    disabled={readOnly}
                    onChange={(e) => updateRow(row.id, { quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-transparent font-medium border-0 focus:ring-1 focus:ring-teal-500 rounded px-1.5 py-1 text-xs"
                  />
                </td>
                <td className="py-2.5 px-3">
                  <select
                    value={row.unit}
                    disabled={readOnly}
                    onChange={(e) => updateRow(row.id, { unit: e.target.value as MeasurementUnit })}
                    className="w-full bg-transparent border-0 focus:ring-1 focus:ring-teal-500 rounded px-1 py-1 text-xs"
                  >
                    {MEASUREMENT_UNITS.map((u) => (
                      <option key={u} value={u} className="dark:bg-gray-900">
                        {labelFor(MEASUREMENT_UNIT_LABEL_MAP, u)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="number"
                    step="0.01"
                    value={row.unit_price || ''}
                    disabled={readOnly}
                    onChange={(e) => updateRow(row.id, { unit_price: parseFloat(e.target.value) || 0 })}
                    placeholder="0,00"
                    className="w-full bg-transparent border-0 focus:ring-1 focus:ring-teal-500 rounded px-1.5 py-1 text-xs"
                  />
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-semibold text-gray-900 dark:text-white">
                  {row.total_price.toFixed(2)} €
                </td>
                {!readOnly && (
                  <td className="py-2.5 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="p-1 rounded text-gray-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50/75 dark:bg-white/[0.02] border-t border-gray-200 dark:border-white/10 font-medium">
            <tr>
              <td colSpan={6} className="py-2 px-3 text-right text-gray-500">
                Zwischensumme Netto:
              </td>
              <td className="py-2 px-3 text-right font-mono font-semibold text-gray-900 dark:text-white">
                {subtotal.toFixed(2)} €
              </td>
              {!readOnly && <td></td>}
            </tr>
            <tr>
              <td colSpan={6} className="py-2 px-3 text-right text-gray-500">
                {isReverseCharge ? 'USt. (§ 13b Reverse Charge 0%):' : 'MwSt. (19%):'}
              </td>
              <td className="py-2 px-3 text-right font-mono text-gray-600 dark:text-gray-300">
                {tax.toFixed(2)} €
              </td>
              {!readOnly && <td></td>}
            </tr>
            <tr className="text-sm font-bold text-teal-600 dark:text-teal-400">
              <td colSpan={6} className="py-2.5 px-3 text-right">
                Gesamtbetrag Brutto:
              </td>
              <td className="py-2.5 px-3 text-right font-mono text-base">
                {total.toFixed(2)} €
              </td>
              {!readOnly && <td></td>}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
