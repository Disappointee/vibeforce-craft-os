import {
  calculateProjectCostSummary,
  DEFAULT_COST_RATES,
} from '../frontend/src/lib/cost-calculation.ts';

console.log('====================================================');
console.log('   VIBE CRAFT M007.2 — COST & MARGIN TESTSUITE      ');
console.log('====================================================\n');

// ----------------------------------------------------
// 1. Realistisches Bauvorhaben (Normallauf)
// ----------------------------------------------------
console.log('--- TEST 1: REALISTISCHES BAUPROJEKT (DB I & DB II) ---');
const project1 = {
  id: 'prj_001',
  name: 'Sanierung Altbau Westflügel',
  budget_hours: 250,
  budget_money: 48000.00,
  external_costs_total: 14500.00,
  status: 'active',
};

const timeEntries1 = [
  {
    id: 'te_1',
    task: 't1',
    user: 'u1',
    duration_minutes: 4800, // 80 Stunden
    expand: { user: { hourly_rate: 55 } },
  },
  {
    id: 'te_2',
    task: 't2',
    user: 'u2',
    duration_minutes: 3600, // 60 Stunden
    expand: { user: { hourly_rate: 50 } },
  },
];

const siteReports1 = [
  {
    id: 'sr_1',
    project: 'prj_001',
    report_date: '2026-09-01',
    qualification_hours: {
      meister: 16,
      geselle: 40,
      helfer: 20,
      azubi: 10,
    },
  },
];

const invoices1 = [
  { net_total: 24000.00 },
  { net_total: 24000.00 },
];

const summary1 = calculateProjectCostSummary({
  project: project1,
  timeEntries: timeEntries1,
  siteReports: siteReports1,
  invoices: invoices1,
});

console.log(`Projekt: ${summary1.projectName}`);
console.log(`Soll-Stunden: ${summary1.sollHours} h | Ist-Stunden: ${summary1.istHours} h (${summary1.hoursBurnupPercent}% Burnup)`);
console.log(`Reststunden: ${summary1.hoursDelta} h | Überhang: ${summary1.isOverrun ? 'JA' : 'NEIN'}`);
console.log(`Erlöse: ${summary1.effectiveRevenue.toFixed(2)} € | Material-/Fremdkosten: ${summary1.materialAndExternalCosts.toFixed(2)} €`);
console.log(`Deckungsbeitrag I: ${summary1.deckungsbeitrag1.toFixed(2)} € (Marge: ${summary1.deckungsbeitrag1MarginPercent}%)`);
console.log(`Lohnkosten gesamt: ${summary1.laborCosts.toFixed(2)} €`);
console.log(`Deckungsbeitrag II: ${summary1.deckungsbeitrag2.toFixed(2)} € (Marge: ${summary1.deckungsbeitrag2MarginPercent}%)`);
console.log(`Margenstatus: ${summary1.profitMarginStatus}`);

// Prüfungen (gemäß gehärteter Antidoppelzählung: Default ist time_entries = 140h)
if (summary1.sollHours !== 250 || summary1.istHours !== 140) {
  throw new Error(`Test 1 Failed: Stundenberechnung fehlerhaft (${summary1.istHours} !== 140)`);
}
if (summary1.hoursDelta !== 110 || summary1.hoursBurnupPercent !== 56.0) {
  throw new Error(`Test 1 Failed: HoursDelta oder Burnup fehlerhaft (${summary1.hoursDelta}, ${summary1.hoursBurnupPercent})`);
}
if (summary1.isOverrun || summary1.isVobOverrun) {
  throw new Error(`Test 1 Failed: Fälschlicherweise Überhang gemeldet`);
}
if (summary1.deckungsbeitrag1 !== 33500.00) {
  throw new Error(`Test 1 Failed: DB I ${summary1.deckungsbeitrag1} !== 33500.00`);
}
if (summary1.laborCosts !== 7400.00) {
  throw new Error(`Test 1 Failed: Lohnkosten ${summary1.laborCosts} !== 7400.00`);
}
if (summary1.deckungsbeitrag2 !== 26100.00) {
  throw new Error(`Test 1 Failed: DB II ${summary1.deckungsbeitrag2} !== 26100.00`);
}
if (summary1.profitMarginStatus !== 'healthy') {
  throw new Error(`Test 1 Failed: Margenstatus sollte 'healthy' sein`);
}

console.log('✅ TEST 1 PASSED: Exakte DB I, DB II und Stundenkalkulation im Normallauf.\n');

// ----------------------------------------------------
// 2. VOB/B § 2 Abs. 3 Schranke (>10% Mehrkostenwarnung)
// ----------------------------------------------------
console.log('--- TEST 2: VOB/B § 2 ABS. 3 MEHRKOSTEN-SCHRANKE (>10%) ---');
// Gleiches Projekt mit 280h Ist (Budget: 250h -> Überschreitung um 12% > 10%)
const heavyTimeEntries = [
  {
    id: 'te_heavy',
    task: 't1',
    user: 'u1',
    duration_minutes: 16800, // 280 Stunden
  },
];

const summary2 = calculateProjectCostSummary({
  project: project1,
  timeEntries: heavyTimeEntries,
});

console.log(`Ist-Stunden: ${summary2.istHours} h vs. Soll: ${summary2.sollHours} h`);
console.log(`Überhang: ${summary2.vobOverrunPercent}% | VOB/B § 2 Trigger: ${summary2.isVobOverrun}`);

if (!summary2.isOverrun) {
  throw new Error('Test 2 Failed: isOverrun sollte true sein');
}
if (!summary2.isVobOverrun) {
  throw new Error('Test 2 Failed: isVobOverrun sollte true sein (>10% Überschreitung)');
}
if (summary2.vobOverrunPercent !== 12.0) {
  throw new Error(`Test 2 Failed: vobOverrunPercent ${summary2.vobOverrunPercent} !== 12.0`);
}

console.log('✅ TEST 2 PASSED: VOB/B § 2 Abs. 3 Schranke schlägt bei 12% Überhang präzise an.\n');

// ----------------------------------------------------
// 3. Division durch Null Schutz (Leere / Neue Baustelle)
// ----------------------------------------------------
console.log('--- TEST 3: ZERO DIVISION & RESILIENCE TEST ---');
const emptyProject = {
  id: 'prj_empty',
  name: 'Neu angelegtes Projekt ohne Budget',
  budget_hours: 0,
  budget_money: 0,
  external_costs_total: 0,
};

const summary3 = calculateProjectCostSummary({
  project: emptyProject,
  timeEntries: [],
  siteReports: [],
  invoices: [],
});

if (Number.isNaN(summary3.hoursBurnupPercent) || !Number.isFinite(summary3.hoursBurnupPercent)) {
  throw new Error('Test 3 Failed: hoursBurnupPercent ist NaN oder unendlich');
}
if (Number.isNaN(summary3.deckungsbeitrag1MarginPercent) || !Number.isFinite(summary3.deckungsbeitrag1MarginPercent)) {
  throw new Error('Test 3 Failed: DB I Margin ist NaN');
}
if (Number.isNaN(summary3.deckungsbeitrag2MarginPercent) || !Number.isFinite(summary3.deckungsbeitrag2MarginPercent)) {
  throw new Error('Test 3 Failed: DB II Margin ist NaN');
}

console.log('✅ TEST 3 PASSED: Zero-Division Schutz greift, keine NaNs bei leeren Projekten.\n');

// ----------------------------------------------------
// 4. Stundensatz-Override (Meister: 75€, Geselle: 60€)
// ----------------------------------------------------
console.log('--- TEST 4: BETRIEBLICHE STUNDENSATZ-ANPASSUNG ---');
const customRates = {
  meister: 75.0,
  geselle: 60.0,
  helfer: 42.0,
  azubi: 28.0,
};

const summary4 = calculateProjectCostSummary({
  project: project1,
  siteReports: siteReports1,
  invoices: invoices1,
  customCostRates: customRates,
  labourSource: 'site_reports',
});

// 16h * 75€ = 1200€
// 40h * 60€ = 2400€
// 20h * 42€ = 840€
// 10h * 28€ = 280€
// Total Lohn = 4720€
console.log(`Lohnkosten mit Custom Rates: ${summary4.laborCosts.toFixed(2)} € (erwartet: 4720.00 €)`);
if (summary4.laborCosts !== 4720.00) {
  throw new Error(`Test 4 Failed: Custom Rates Lohnkosten ${summary4.laborCosts} !== 4720.00`);
}

console.log('✅ TEST 4 PASSED: Dynamischer Verrechnungssatz-Override erfolgreich.\n');

// ----------------------------------------------------
// 5. Kritische / Negative Marge (Kostenfalle)
// ----------------------------------------------------
console.log('--- TEST 5: KRITISCHE MARGE & DEFICIT TEST ---');
const badProject = {
  id: 'prj_bad',
  name: 'Verlust-Baustelle',
  budget_hours: 100,
  budget_money: 10000.00,
  external_costs_total: 8000.00, // 80% Materialkosten
};

const deficitEntries = [
  {
    id: 'te_def',
    task: 't1',
    user: 'u1',
    duration_minutes: 6000, // 100h * 50€ = 5000€ Lohnkosten
  },
];

const summary5 = calculateProjectCostSummary({
  project: badProject,
  timeEntries: deficitEntries,
});

// Revenue: 10000
// Material: 8000 -> DB I = 2000 (20%)
// Lohn: 5000 -> DB II = 2000 - 5000 = -3000 (-30%)
console.log(`DB I: ${summary5.deckungsbeitrag1.toFixed(2)} € | DB II: ${summary5.deckungsbeitrag2.toFixed(2)} € (Marge: ${summary5.deckungsbeitrag2MarginPercent}%)`);
console.log(`Status: ${summary5.profitMarginStatus}`);

if (summary5.deckungsbeitrag2 !== -3000.00) {
  throw new Error(`Test 5 Failed: DB II ${summary5.deckungsbeitrag2} !== -3000.00`);
}
if (summary5.profitMarginStatus !== 'critical') {
  throw new Error(`Test 5 Failed: Status sollte 'critical' sein`);
}

console.log('✅ TEST 5 PASSED: Defizit-Erkennung & Status "critical" einwandfrei.\n');

console.log('====================================================');
console.log('   🎉 ALLE 5 NACHKALKULATIONS-TESTS BESTANDEN!      ');
console.log('====================================================');
