/**
 * Centralized DE-i18n System — Vibeforce Flow OS
 *
 * Deep-nested translation dictionary with `as const` for exact string literal types.
 * Keys are accessed via dot notation (e.g., "report.filter.group_by._" for the label,
 * "report.filter.group_by.project" for an option).
 *
 * Branch labels use the `_` convention so that both the label string and its child
 * option strings are valid Paths<T> keys simultaneously.
 *
 * FAILSAFE: Missing keys return the key itself as visible error indicator.
 * Referenz: docs/string-registry.md
 */

// ─────────────────────────────────────────────
// Helper Types — Dot-Notation Paths
// ─────────────────────────────────────────────

type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}${'' extends P ? '' : '.'}${P}`
    : never
  : never;

type Paths<T> = T extends object
  ? { [K in keyof T]-?: K extends string | number ? Join<K, Paths<T[K]>> : never }[keyof T]
  : '';

// ─────────────────────────────────────────────
// Translation Map — ALL UI Strings centralized
// ─────────────────────────────────────────────

export const dict = {
  // ---------- Navigation ----------
  nav: {
    dashboard: 'Dashboard',
    my_tasks: 'Meine Aufgaben',
    planner: 'Planer',
    time_tracking: 'Zeiterfassung',
    clients: 'Kunden',
    team: 'Team',
    admin: 'Admin',
    reports: 'Zeitauswertungen',
    notifications: 'Benachrichtigungen',
    logout: 'Abmelden',
    aufgaben: 'Aufgaben',
    projekte: 'Projekte',
    einstellungen: 'Einstellungen',
    search_placeholder: 'Suchen nach Projekten, Aufgaben…',
    sidebar_toggle: 'Seitenleiste ausblenden',
    user_menu_profile: 'Profil',
    user_menu_settings: 'Einstellungen',
    user_menu_logout_mobile: 'Abmelden',
    confirm_logout_title: 'Wirklich abmelden?',
    confirm_logout_desc: 'Du wirst von deinem Konto abgemeldet.',
    confirm_logout_cancel: 'Abbrechen',
    confirm_logout_confirm: 'Abmelden',
    user_role_member: 'Mitglied',
    user_role_admin: 'Admin',
    night_shift: 'Night Shift',
  },

  // ---------- General Actions ----------
  action: {
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    new: 'Neu',
    close: 'Schließen',
    reset: 'Zurücksetzen',
    confirm: 'Bestätigen',
    search: 'Suchen',
    filter: 'Filter',
    export: 'Export',
    download: 'Herunterladen',
    upload: 'Hochladen',
    generate: 'Generieren',
    print: 'Drucken',
  },

  // ---------- Auth ----------
  auth: {
    login_title: 'Vibeforce Flow OS',
    login_subtitle: 'Das intelligente Agentur-Betriebssystem.',
    login_button: 'Anmelden',
    login_error: 'Anmeldung fehlgeschlagen. Bitte prüfe deine Daten.',
    email_label: 'E-Mail-Adresse',
    password_label: 'Passwort',
    version: 'Selbst gehostet — Vibeforce Flow OS v0.1',
    login: {
      title: 'Vibeforce Flow OS',
      subtitle: 'Das intelligente Agentur-Betriebssystem.',
      email: 'E-Mail-Adresse',
      password: 'Passwort',
      forgot: 'Vergessen?',
      submit: 'Anmelden',
      noAccount: 'Noch kein Zugang?',
      contactAdmin: 'Admin kontaktieren',
      selfHosted: 'Selbst gehostet — Vibeforce Flow OS v0.1',
    },
    forgotPassword: {
      title: 'Passwort vergessen',
      desc: 'Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen deines Passworts.',
      email: 'E-Mail-Adresse',
      submit: 'Link senden',
      success: 'E-Mail gesendet',
      successDesc: 'Falls ein Konto mit dieser E-Mail existiert, wurde ein Link zum Zurücksetzen gesendet. Bitte prüfe dein Postfach.',
      backToLogin: 'Zurück zur Anmeldung',
      smtpError: 'Die E-Mail konnte nicht gesendet werden. Bitte versuche es später erneut oder kontaktiere den Administrator.',
    },
    resetPassword: {
      title: 'Passwort zurücksetzen',
      desc: 'Gib ein neues Passwort für dein Konto ein.',
      newPassword: 'Neues Passwort',
      confirmPassword: 'Passwort bestätigen',
      submit: 'Passwort speichern',
      success: 'Passwort geändert',
      successDesc: 'Dein Passwort wurde erfolgreich geändert. Du wirst zur Anmeldung weitergeleitet.',
      invalidToken: 'Ungültiger Link',
      invalidTokenDesc: 'Dieser Link ist ungültig.',
      expiredToken: 'Link abgelaufen oder bereits genutzt',
      expiredTokenDesc: 'Bitte fordere einen neuen Link zum Zurücksetzen an.',
      requestNew: 'Neuen Link anfordern',
      passwordRules: 'Mindestens 8 Zeichen',
      mismatch: 'Passwörter stimmen nicht überein',
    },
    contactAdmin: {
      title: 'Admin kontaktieren',
      desc: 'Schreibe eine Nachricht an den Administrator.',
      email: 'Deine E-Mail-Adresse',
      subject: 'Betreff',
      message: 'Nachricht',
      submit: 'Nachricht senden',
      success: 'Nachricht gesendet',
      successDesc: 'Deine Nachricht wurde an den Administrator weitergeleitet.',
      error: 'Nachricht konnte nicht gesendet werden. Bitte versuche es später erneut.',
      rateLimit: 'Zu viele Anfragen. Bitte warte 60 Sekunden.',
      privacy: 'Mit dem Absenden stimmst du der Verarbeitung deiner Daten (E-Mail, Betreff, Nachricht) zur Bearbeitung deiner Anfrage zu. Die Nachricht wird nicht gespeichert, sondern nur per E-Mail weitergeleitet.',
    },
  } as const,

  // ---------- Reports ----------
  report: {
    filter: {
      group_by: {
        _: 'Gruppieren nach',
        project: 'Projekt',
        user: 'Mitarbeiter',
        both: 'Projekt & Mitarbeiter',
      },
      billable: {
        _: 'Abrechenbarkeit',
        all: 'Alle',
        billable: 'Nur abrechenbar',
        non_billable: 'Nur nicht abrechenbar',
        ready_to_invoice: 'Bereit zur Rechnungsstellung',
      },
      date_from: 'Von',
      date_to: 'Bis',
      clients: 'Kunden',
      projects: 'Projekte',
      users: 'Mitarbeiter',
      no_clients: 'Keine Kunden verfügbar',
      no_projects: 'Keine Projekte verfügbar',
      no_users: 'Keine Mitarbeiter verfügbar',
    },
    preset: {
      monthly_overview: {
        _: 'Monatliche Erfassungsübersicht',
        description: 'Gruppiert nach Monat / Mitarbeiter',
      },
      planned_vs_actual: {
        _: 'Erfasst vs. geplant',
        description: 'Budget-Prüfung der Projekte',
      },
      billable_by_user: {
        _: 'Abrechenbarkeit pro Mitarbeiter',
        description: 'Nur abrechenbare Zeiten',
      },
      ready_to_invoice: {
        _: 'Bereit zur Rechnungsstellung',
        description: 'Abrechenbar und noch offen',
      },
    },
    tab: {
      hours: 'Stundenauswertung',
      billing: 'Abrechnungs-Dashboard',
    },
    summary: {
      total_hours: 'Gesamtstunden',
      billable: 'Abrechenbar',
      total_budget: 'Budget gesamt',
      budget_used: 'Budget genutzt',
      hour_distribution: 'Stundenverteilung',
      detail_table: 'Detailtabelle',
      entries: 'Einträge',
      no_data: 'Keine Daten für den ausgewählten Zeitraum gefunden.',
      no_chart_data: 'Keine Daten für Diagramm verfügbar',
    },
    export: {
      csv: 'Als CSV exportieren',
      excel: 'Als Excel exportieren',
      pdf: 'Als PDF exportieren',
      title: 'Export',
    },
    template: {
      save: 'Vorlage speichern',
      load: 'Vorlage laden',
      delete: 'Löschen',
      name: 'Vorlagenname',
      no_name: 'Bitte Namen eingeben',
      saved: 'Vorlage gespeichert',
      empty: 'Keine Vorlagen',
    },
    table: {
      project: 'Projekt',
      hours: 'Stunden',
      billable: 'Abrechenbar',
      tasks: 'Tasks',
      budget: 'Budget',
    },
  },

  // ---------- Billing Dashboard ----------
  billing: {
    title: 'Rechnungsbereite Projekte',
    open_revenue: 'Offener Umsatz',
    billable_hours: 'Abrechenbare Stunden',
    ready_count: 'Rechnungsbereit',
    avg_per_project: 'Ø pro Projekt',
    invoice_template_title: 'Rechnungsvorlage erstellen',
    invoice_template_desc: 'Wähle ein Projekt aus, um eine Rechnungsvorlage mit allen abrechenbaren Leistungen zu generieren. Die Vorlage kann als PDF gespeichert werden.',
    print_service_record: 'Leistungsnachweis',
    project_count: 'Projekte',
  },

  // ---------- PDF Templates ----------
  pdf: {
    service_record: { title: 'Leistungsnachweis' },
    timesheet: { title: 'Stundenzettel' },
    invoice: { title: 'Rechnung' },
    col: {
      date: 'Datum',
      description: 'Leistung',
      hours: 'Stunden',
      rate: 'Satz',
      amount: 'Betrag',
      employee: 'Mitarbeiter',
      activity: 'Tätigkeit',
      duration: 'Dauer',
    },
    sum_label: 'Gesamt',
    invoice_number: 'Rechnungsnummer',
    invoice_date: 'Rechnungsdatum',
    period: 'Leistungszeitraum',
    subtotal: 'Zwischensumme',
    vat: 'MwSt.',
    total: 'Gesamtbetrag',
    footer: 'Vielen Dank für Ihren Auftrag.',
    regenerated: 'Wiederholter Abdruck',
    your_company: 'Ihr Unternehmen',
  },

  // ---------- Time Tracking ----------
  time: {
    manual_entry: 'Zeiteintrag erfassen',
    working_on: 'Woran arbeitest du gerade?',
    billable: 'Abrechenbar',
    set_start_time: 'Startzeit manuell setzen',
    add_description: '+ Beschreibung',
    minimize: 'Minimieren',
    week_view: 'Wochenansicht',
    month_view: 'Monatsansicht',
    total_hours: 'Gesamt erfasst',
    filtered: 'Gefiltert',
    all_projects: 'Alle Projekte',
    no_entries: 'Keine Zeiteinträge gefunden',
  },

  // ---------- Planner ----------
  planner: {
    title: 'Planer',
    subtitle: 'Zeitplan und Meilensteine aller Projekte im Überblick.',
    sidebar_title: 'Projektstruktur',
    sidebar_empty: 'Keine Aufgaben mit Datum',
    view_day: 'Tag',
    view_week: 'Woche',
    view_month: 'Monat',
    view_year: 'Jahr',
    toolbar_label: 'Ansicht',
    gantt_popup_progress: 'Fortschritt:',
    loading: 'Lade Gantt-Daten…',
    error: 'Fehler beim Laden der Gantt-Daten:',
    empty: 'Keine Aufgaben mit Datumsangaben vorhanden.',
  },

  // ---------- Task Table ----------
  task: {
    status: {
      todo: 'Offen',
      in_progress: 'In Arbeit',
      review: 'Prüfung',
      done: 'Erledigt',
    },
    priority: {
      low: 'Niedrig',
      medium: 'Mittel',
      high: 'Hoch',
      acute: 'Akut',
    },
    column: {
      title: 'Aufgabe',
      status: 'Status',
      priority: 'Priorität',
      assignee: 'Zuständig',
      due_date: 'Fällig',
      project: 'Projekt',
    },
    group_by_cycle: 'Zyklen',
  },

  // ---------- Project ----------
  project: {
    budget_type: {
      fixed: 'Festpreis',
      hourly: 'Stundensatz',
      retainer: 'Retainer',
    },
    status: {
      active: 'Aktiv',
      completed: 'Abgeschlossen',
      archived: 'Archiviert',
    },
  },

  // ---------- Dashboard ----------
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Willkommen zurück! Alle Projekte im Überblick.',
    kpi_open_tasks: 'Offene Aufgaben',
    kpi_total_hours: 'Erfasste Stunden',
    kpi_active_projects: 'Aktive Projekte',
    kpi_team_members: 'Teammitglieder',
    remaining_label: 'Rest',
    project_hours_alert: 'Projekt-Stunden-Warnung',
    select_project_hint: 'Wähle ein Projekt aus, um Aufgaben und Zeiterfassung zu verwalten.',
  },

  // ---------- Admin / User Roles ----------
  role: {
    admin: 'Administrator',
    manager: 'Manager',
    employee: 'Mitarbeiter',
    freelancer: 'Freelancer',
    client: 'Kunde',
  },

  // ---------- Team ----------
  team: {
    title: 'Team',
    role_member: 'Mitglied',
  },

  // ---------- Notifications ----------
  notifications: {
    title: 'Benachrichtigungen',
    unread_badge: 'ungelesen',
    subtitle: 'Alle Benachrichtigungen auf einen Blick.',
    mark_all_read: 'Alle als gelesen markieren',
    mark_read: 'Als gelesen markieren',
    mark_unread: 'Als ungelesen markieren',
    view: 'Ansehen',
    delete: 'Löschen',
    no_notifications: 'Keine Benachrichtigungen',
    empty: 'Du hast noch keine Benachrichtigungen erhalten.',
    filter_empty: 'Keine Benachrichtigungen entsprechen deinen Filterkriterien.',
    all_read: 'Alle gelesen',
    show_all: 'Alle Benachrichtigungen anzeigen',
    filter: {
      type: 'Typ',
      status: 'Status',
      all_types: 'Alle Typen',
      all_statuses: 'Alle',
      unread: 'Ungelesen',
      read: 'Gelesen',
    },
    type: {
      task_assigned: 'Zugewiesen',
      task_due: 'Fälligkeit',
      task_comment: 'Kommentar',
      task_mention: 'Erwähnung',
      status_change: 'Statusänderung',
      project_update: 'Projektupdate',
    },
  },

  // ---------- Client ----------
  client: {
    status: {
      noch_nicht_gestartet: 'Noch nicht gestartet',
      aktiv: 'Aktiv',
      beendet: 'Beendet',
    },
  },

  // ---------- Profile ----------
  profile: {
    password_title: 'Passwort ändern',
    password_desc: 'Ändere dein Passwort für die Anmeldung',
    notify_task_assign: 'Aufgabenzuweisung',
    notify_task_assign_desc: 'Wenn dir eine Aufgabe zugewiesen wird',
    notify_task_due: 'Aufgaben-Fälligkeit',
    notify_task_due_desc: 'Wenn eine Aufgabe bald fällig ist',
    avatar_too_large: 'Datei zu groß',
  },

  // ---------- TimerBar ----------
  timerbar: {
    toast: {
      resumed: 'Timer fortgesetzt',
      paused: 'Timer pausiert',
      select_task: 'Bitte wähle eine Aufgabe aus',
      started: 'Timer gestartet für:',
      started_at: 'ab',
      stopped: 'Zeit erfasst:',
      stopped_unit: 'Min. für',
      save_error: 'Fehler beim Speichern der Zeit',
      note_saved: 'Notiz gespeichert',
      note_save_error: 'Fehler beim Speichern der Notiz',
    },
    collapsed_label: 'Timer',
    title: {
      resume: 'Fortsetzen',
      pause: 'Pause',
      minimize: 'Minimieren',
      expand: 'Ausklappen',
      not_billable: 'Nicht abrechenbar',
      set_start_time: 'Startzeit manuell setzen',
    },
    task_placeholder: 'Woran arbeitest du gerade?',
    task_search: 'Aufgabe suchen...',
    no_tasks: 'Keine passenden Aufgaben gefunden',
    billable: 'Abrechenbar',
    internal: 'Intern',
    backdate_title: 'Startzeit zurückdatieren',
    date_label: 'Datum',
    time_label: 'Uhrzeit',
    done: 'Fertig',
    add_description: '+ Beschreibung',
    note_placeholder: 'Notiz hinzufügen...',
    zeroclaw_active: 'Vibeforce Flow OS',
    timer_inactive: 'Timer nicht aktiv',
    select_task_hint: 'Wähle eine Aufgabe aus, um den Timer zu starten',
  },

  // ---------- Misc UI ----------
  ui: {
    loading: 'Lädt...',
    error: 'Fehler',
    empty: 'Keine Daten',
    not_available: '--',
  },

  // ---------- VIBE Craft (M007) ----------
  craft: {
    title: 'VIBE Craft',
    geofence: {
      title: 'Geofence-Einstellungen',
      type_none: 'Kein Geofence',
      type_circle: 'Kreis-Radius',
      type_polygon: 'Polygon-Bereich',
      radius_label: 'Radius (Meter)',
      center_label: 'Mittelpunkt',
      search_address: 'Adresse suchen (Nominatim)…',
      draw_polygon: 'Polygon zeichnen',
      clear_polygon: 'Polygon zurücksetzen',
      auto_prompt: 'Automatischer Check-in-Vorschlag',
      auto_prompt_desc: 'Mitarbeiter beim Betreten der Baustelle fragen, ob der Timer gestartet werden soll',
      prompt_title: 'Baustelle erreicht!',
      prompt_message: 'Du befindest dich im Bereich von "{project}". Zeiterfassung jetzt starten?',
      prompt_start: 'Zeiterfassung starten',
      prompt_dismiss: 'Jetzt nicht',
      saved_success: 'Geofence-Einstellungen erfolgreich gespeichert',
    },
    site_report: {
      title: 'Regie- & Bautagesberichte',
      new: 'Neuer Bericht',
      edit: 'Bericht bearbeiten',
      status_draft: 'Entwurf',
      status_signed: 'Vom Kunden signiert',
      status_invoiced: 'Abgerechnet',
      date: 'Berichtsdatum',
      weather: 'Wetterbedingungen',
      temperature: 'Temperatur (°C)',
      work_performed: 'Ausgeführte Arbeiten',
      special_events: 'Besondere Vorkommnisse / Behinderungen',
      qualification_hours: 'Stunden nach Qualifikation',
      hours_meister: 'Meisterstunden',
      hours_geselle: 'Gesellenstunden',
      hours_helfer: 'Helferstunden',
      hours_azubi: 'Azubistunden',
      client_name: 'Name des Auftraggebers / Bauleiters',
      sign_now: 'Vor Ort signieren',
      sign_client: 'Unterschrift Auftraggeber',
      sign_contractor: 'Unterschrift Auftragnehmer',
      clear_signature: 'Unterschrift löschen',
      save_report: 'Bericht speichern',
      export_pdf: 'Bautagesbericht als PDF',
      generate_invoice: 'ZUGFeRD-Rechnung erstellen',
      no_reports: 'Noch keine Regieberichte für dieses Projekt vorhanden.',
    },
    measurement: {
      title: 'VOB-Aufmaß',
      add_position: 'Aufmaßposition hinzufügen',
      position_nr: 'Pos.-Nr.',
      item_title: 'Bezeichnung / Leistung',
      formula: 'Berechnungsformel (L × B × H)',
      quantity: 'Menge',
      unit: 'Einheit',
      unit_price: 'Einheitspreis (€)',
      total_price: 'Gesamtpreis (€)',
      notes: 'Anmerkungen / Abzug nach VOB',
      unit_m: 'm (Meter)',
      unit_m2: 'm² (Quadratmeter)',
      unit_m3: 'm³ (Kubikmeter)',
      unit_h: 'h (Stunden)',
      unit_stk: 'Stk (Stück)',
      unit_kg: 'kg (Kilogramm)',
      unit_psch: 'psch (Pauschal)',
      no_measurements: 'Keine Aufmaßpositionen erfasst.',
    },
    evidence: {
      title: 'Bautagebuch & Fotodokumentation',
      upload: 'Beweisfoto aufnehmen / hochladen',
      caption: 'Bildbeschreibung / Mangelnotiz',
      hash_label: 'SHA-256 Integritätshash',
      timestamp_label: 'Aufnahmezeitpunkt',
      gps_label: 'GPS-Standort',
      no_items: 'Keine Fotos vorhanden.',
    },
    invoice: {
      title: 'ZUGFeRD E-Rechnung (EN16931)',
      type_abschlag: 'Abschlagsrechnung',
      type_schluss: 'Schlussrechnung',
      type_standard: 'Standardrechnung',
      generate_xml: 'ZUGFeRD 2.1.1 XML erzeugen',
      invoice_number: 'Rechnungsnummer',
      net: 'Nettobetrag',
      tax: 'Umsatzsteuer (19%)',
      gross: 'Bruttobetrag',
      datev_export: 'DATEV Buchungsstapel exportieren',
      datev_success: 'DATEV-Export erfolgreich erstellt',
    },
    offline: {
      status_online: 'Online',
      status_offline: 'Offline — Änderungen werden lokal gespeichert',
      sync_pending: 'Ausstehende Synchronisierungen',
      sync_now: 'Jetzt synchronisieren',
      sync_success: 'Offline-Daten erfolgreich synchronisiert',
    },
  },

  // ───── Keine Duplikate: nav.* enthält alle Navigations-Labels ─────
} as const;

export type TranslationKey = Paths<typeof dict>;

// ─────────────────────────────────────────────
// Failsafe: Translation Lookup via Dot Notation
// ─────────────────────────────────────────────
export function t(path: TranslationKey): string {
  const keys = path.split('.');
  let result: any = dict;

  for (const key of keys) {
    if (result === undefined || result[key] === undefined) {
      console.warn(`[i18n] Missing translation: "${path}"`);
      return path;
    }
    result = result[key];
  }

  return typeof result === 'string' ? result : path;
}

// ─────────────────────────────────────────────
// Typed Constants for Select Values
// ─────────────────────────────────────────────
export const GROUP_BY_OPTIONS = [
  { value: 'project' as const, label: t('report.filter.group_by.project') },
  { value: 'user' as const, label: t('report.filter.group_by.user') },
  { value: 'both' as const, label: t('report.filter.group_by.both') },
] as const;

export const BILLABLE_FILTER_OPTIONS = [
  { value: 'all' as const, label: t('report.filter.billable.all') },
  { value: 'billable' as const, label: t('report.filter.billable.billable') },
  { value: 'non_billable' as const, label: t('report.filter.billable.non_billable') },
  { value: 'ready_to_invoice' as const, label: t('report.filter.billable.ready_to_invoice') },
] as const;

export const TASK_STATUS_LABELS: Record<string, string> = {
  todo: t('task.status.todo'),
  in_progress: t('task.status.in_progress'),
  review: t('task.status.review'),
  done: t('task.status.done'),
};

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  low: t('task.priority.low'),
  medium: t('task.priority.medium'),
  high: t('task.priority.high'),
  acute: t('task.priority.acute'),
};

export const ROLE_LABELS: Record<string, string> = {
  admin: t('role.admin'),
  manager: t('role.manager'),
  employee: t('role.employee'),
  freelancer: t('role.freelancer'),
  client: t('role.client'),
};

export const PROJECT_BUDGET_TYPE_LABELS: Record<string, string> = {
  fixed: t('project.budget_type.fixed'),
  hourly: t('project.budget_type.hourly'),
  retainer: t('project.budget_type.retainer'),
};

export const CLIENT_STATUS_LABELS: Record<string, string> = {
  noch_nicht_gestartet: t('client.status.noch_nicht_gestartet'),
  aktiv: t('client.status.aktiv'),
  beendet: t('client.status.beendet'),
};
