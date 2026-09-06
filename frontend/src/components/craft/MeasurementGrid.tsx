'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  tax_rate_type?: 'reverse_charge_13b' | 'standard_19';
  notes?: string;
}

interface MeasurementGridProps {
  initialItems?: MeasurementRowItem[];
  onChange?: (items: MeasurementRowItem[]) => void;
  readOnly?: boolean;
  isReverseCharge?: boolean;
}

const SAFE_EXPR_REGEX = /^[\d+\-*/().,\s]+$/;

/**
 * Secure math expression evaluator using Shunting-Yard algorithm.
 * No eval(), no new Function() — fully CSP-compliant.
 * Supports: +, -, *, /, parentheses, German decimal commas.
 */
function safeEval(expr: string): number {
  const trimmed = expr.trim();
  if (!trimmed) return 0;
  if (!SAFE_EXPR_REGEX.test(trimmed)) {
    return 0;
  }

  try {
    // German decimal commas → dots, then tokenize
    const normalized = trimmed.replace(/,/g, '.');
    const tokens = tokenize(normalized);
    if (tokens.length === 0) return 0;
    const res = parseExpression(tokens);
    return typeof res === 'number' && Number.isFinite(res) ? Math.round(res * 1000) / 1000 : 0;
  } catch {
    return 0;
  }
}

type Token = { type: 'num'; value: number } | { type: 'op'; value: string } | { type: 'lp' } | { type: 'rp' };

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (ch === ' ') { i++; continue; }
    if (ch === '(') { tokens.push({ type: 'lp' }); i++; continue; }
    if (ch === ')') { tokens.push({ type: 'rp' }); i++; continue; }
    if (ch === '+' || ch === '*' || ch === '/') {
      tokens.push({ type: 'op', value: ch }); i++; continue;
    }
    // Handle minus: unary if at start, after '(' or after another operator
    if (ch === '-') {
      const prev = tokens[tokens.length - 1];
      if (!prev || prev.type === 'lp' || prev.type === 'op') {
        // Unary minus: read the following number
        i++;
        let numStr = '';
        while (i < expr.length && (expr[i] >= '0' && expr[i] <= '9' || expr[i] === '.')) {
          numStr += expr[i]; i++;
        }
        if (numStr) {
          tokens.push({ type: 'num', value: -parseFloat(numStr) });
        } else {
          // Minus before parenthesis: push -1 * (
          tokens.push({ type: 'num', value: -1 });
          tokens.push({ type: 'op', value: '*' });
        }
        continue;
      }
      tokens.push({ type: 'op', value: '-' }); i++; continue;
    }
    if ((ch >= '0' && ch <= '9') || ch === '.') {
      let numStr = '';
      while (i < expr.length && (expr[i] >= '0' && expr[i] <= '9' || expr[i] === '.')) {
        numStr += expr[i]; i++;
      }
      tokens.push({ type: 'num', value: parseFloat(numStr) });
      continue;
    }
    // Unknown character — reject
    return [];
  }
  return tokens;
}

function parseExpression(tokens: Token[]): number {
  const outputQueue: number[] = [];
  const operatorStack: (string | 'lp')[] = [];

  const precedence: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };

  const applyOp = (op: string) => {
    const b = outputQueue.pop()!;
    const a = outputQueue.pop()!;
    switch (op) {
      case '+': outputQueue.push(a + b); break;
      case '-': outputQueue.push(a - b); break;
      case '*': outputQueue.push(a * b); break;
      case '/': outputQueue.push(b === 0 ? Infinity : a / b); break;
    }
  };

  for (const token of tokens) {
    if (token.type === 'num') {
      outputQueue.push(token.value);
    } else if (token.type === 'op') {
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1] !== 'lp' &&
        (precedence[operatorStack[operatorStack.length - 1]] || 0) >= precedence[token.value]
      ) {
        applyOp(operatorStack.pop()!);
      }
      operatorStack.push(token.value);
    } else if (token.type === 'lp') {
      operatorStack.push('lp');
    } else if (token.type === 'rp') {
      while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== 'lp') {
        applyOp(operatorStack.pop()!);
      }
      if (operatorStack.length === 0) return 0; // Mismatched parentheses
      operatorStack.pop(); // Remove 'lp'
    }
  }

  while (operatorStack.length > 0) {
    const op = operatorStack.pop()!;
    if (op === 'lp') return 0; // Mismatched parentheses
    applyOp(op);
  }

  return outputQueue.length === 1 ? outputQueue[0] : 0;
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
  const defaultTaxType = isReverseCharge ? 'reverse_charge_13b' : 'standard_19';

  const [rows, setRows] = useState<MeasurementRowItem[]>(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems.map(item => ({
        ...item,
        tax_rate_type: item.tax_rate_type || defaultTaxType,
      }));
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
        tax_rate_type: defaultTaxType,
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
        tax_rate_type: defaultTaxType,
      },
    ]);
  }, [defaultTaxType]);

  const removeRow = useCallback((id: string) => {
    setRows((prev) => {
      const filtered = prev.filter((r) => r.id !== id);
      return filtered.map((r, idx) => ({ ...r, position_nr: generatePosNr(idx) }));
    });
  }, []);

  // Stabilize onChange via ref to prevent infinite loops if parent
  // passes an inline function (unstable reference) as onChange prop.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    onChangeRef.current?.(rows);
  }, [rows]);

  const subtotal = useMemo(
    () => rows.reduce((sum, r) => sum + (r.total_price || 0), 0),
    [rows]
  );
  const subtotal19 = useMemo(
    () => rows.filter(r => (r.tax_rate_type || defaultTaxType) === 'standard_19').reduce((sum, r) => sum + (r.total_price || 0), 0),
    [rows, defaultTaxType]
  );
  const subtotal13b = useMemo(
    () => rows.filter(r => (r.tax_rate_type || defaultTaxType) === 'reverse_charge_13b').reduce((sum, r) => sum + (r.total_price || 0), 0),
    [rows, defaultTaxType]
  );
  const tax19 = useMemo(() => Math.round(subtotal19 * 0.19 * 100) / 100, [subtotal19]);
  const total = useMemo(() => Math.round((subtotal + tax19) * 100) / 100, [subtotal, tax19]);

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
              <th className="py-3 px-3 min-w-[180px]">Bezeichnung / Leistung</th>
              <th className="py-3 px-3 min-w-[150px]">Formel (L × B × H)</th>
              <th className="py-3 px-3 w-20">Menge</th>
              <th className="py-3 px-3 w-24">Einheit</th>
              <th className="py-3 px-3 w-24">EP (€)</th>
              <th className="py-3 px-3 w-28">Steuersatz</th>
              <th className="py-3 px-3 w-24 text-right">GP (€)</th>
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
                <td className="py-2.5 px-3">
                  <select
                    value={row.tax_rate_type || defaultTaxType}
                    disabled={readOnly}
                    onChange={(e) => updateRow(row.id, { tax_rate_type: e.target.value as 'reverse_charge_13b' | 'standard_19' })}
                    className="w-full bg-transparent border-0 focus:ring-1 focus:ring-teal-500 rounded px-1 py-1 text-[11px] font-medium text-muted-foreground focus:text-foreground"
                  >
                    <option value="reverse_charge_13b" className="dark:bg-gray-900">0% (§ 13b)</option>
                    <option value="standard_19" className="dark:bg-gray-900">19% USt</option>
                  </select>
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
              <td colSpan={7} className="py-2 px-3 text-right text-gray-500">
                Zwischensumme Netto:
              </td>
              <td className="py-2 px-3 text-right font-mono font-semibold text-gray-900 dark:text-white">
                {subtotal.toFixed(2)} €
              </td>
              {!readOnly && <td></td>}
            </tr>
            {subtotal13b > 0 && (
              <tr>
                <td colSpan={7} className="py-1.5 px-3 text-right text-gray-500 text-[11px]">
                  USt. (§ 13b Reverse Charge 0% auf {subtotal13b.toFixed(2)} €):
                </td>
                <td className="py-1.5 px-3 text-right font-mono text-gray-600 dark:text-gray-300 text-[11px]">
                  0,00 €
                </td>
                {!readOnly && <td></td>}
              </tr>
            )}
            {subtotal19 > 0 && (
              <tr>
                <td colSpan={7} className="py-1.5 px-3 text-right text-gray-500 text-[11px]">
                  MwSt. (19% auf {subtotal19.toFixed(2)} €):
                </td>
                <td className="py-1.5 px-3 text-right font-mono text-gray-600 dark:text-gray-300 text-[11px]">
                  {tax19.toFixed(2)} €
                </td>
                {!readOnly && <td></td>}
              </tr>
            )}
            <tr className="text-sm font-bold text-teal-600 dark:text-teal-400">
              <td colSpan={7} className="py-2.5 px-3 text-right">
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
