/**
 * Centralized Multi-Language i18n System — Vibeforce Flow OS
 * Supporting Deutsch (DE) and English (EN) with 100% Key Parity.
 *
 * DIN 18299 / VOB / ZUGFeRD 2.1.1 EN16931 Compliant Terminology.
 * Hydration-safe Zustand integration via useSettingsStore.
 */

'use client';

import { useCallback } from 'react';
import { useSettingsStore } from './store';
import type { UserLanguage } from './pocketbase-types';

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
// Dictionaries (DE & EN with 100% Key Parity)
// ─────────────────────────────────────────────

export const deDict = {
  "nav": {
    "dashboard": "Dashboard",
    "my_tasks": "Meine Aufgaben",
    "my_times": "Meine Zeiten",
    "planner": "Planer",
    "time_tracking": "Zeiterfassung",
    "clients": "Kunden",
    "team": "Team",
    "admin": "Admin",
    "reports": "Zeitauswertungen",
    "notifications": "Benachrichtigungen",
    "logout": "Abmelden",
    "aufgaben": "Aufgaben",
    "projekte": "Projekte",
    "einstellungen": "Einstellungen",
    "search_placeholder": "Suchen nach Projekten, Aufgaben…",
    "sidebar_toggle": "Seitenleiste ausblenden",
    "user_menu_profile": "Profil",
    "user_menu_settings": "Einstellungen",
    "user_menu_logout_mobile": "Abmelden",
    "confirm_logout_title": "Wirklich abmelden?",
    "confirm_logout_desc": "Du wirst von deinem Konto abgemeldet.",
    "confirm_logout_cancel": "Abbrechen",
    "confirm_logout_confirm": "Abmelden",
    "user_role_member": "Mitglied",
    "user_role_admin": "Admin",
    "night_shift": "Night Shift",
    "craft": "Handwerk & Baustelle",
    "docs": "Handbuch & Hilfe"
  },
  "action": {
    "save": "Speichern",
    "cancel": "Abbrechen",
    "delete": "Löschen",
    "edit": "Bearbeiten",
    "new": "Neu",
    "close": "Schließen",
    "reset": "Zurücksetzen",
    "confirm": "Bestätigen",
    "search": "Suchen",
    "filter": "Filter",
    "export": "Export",
    "download": "Herunterladen",
    "upload": "Hochladen",
    "generate": "Generieren",
    "print": "Drucken"
  },
  "auth": {
    "login_title": "Vibeforce Flow OS",
    "login_subtitle": "Das intelligente Agentur-Betriebssystem.",
    "login_button": "Anmelden",
    "login_error": "Anmeldung fehlgeschlagen. Bitte prüfe deine Daten.",
    "email_label": "E-Mail-Adresse",
    "password_label": "Passwort",
    "version": "Selbst gehostet — Vibeforce Flow OS v0.1",
    "login": {
      "title": "Vibeforce Flow OS",
      "subtitle": "Das intelligente Agentur-Betriebssystem.",
      "email": "E-Mail-Adresse",
      "password": "Passwort",
      "forgot": "Vergessen?",
      "submit": "Anmelden",
      "noAccount": "Noch kein Zugang?",
      "contactAdmin": "Admin kontaktieren",
      "selfHosted": "Selbst gehostet — Vibeforce Flow OS v0.1"
    },
    "forgotPassword": {
      "title": "Passwort vergessen",
      "desc": "Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen deines Passworts.",
      "email": "E-Mail-Adresse",
      "submit": "Link senden",
      "success": "E-Mail gesendet",
      "successDesc": "Falls ein Konto mit dieser E-Mail existiert, wurde ein Link zum Zurücksetzen gesendet. Bitte prüfe dein Postfach.",
      "backToLogin": "Zurück zur Anmeldung",
      "smtpError": "Die E-Mail konnte nicht gesendet werden. Bitte versuche es später erneut oder kontaktiere den Administrator."
    },
    "resetPassword": {
      "title": "Passwort zurücksetzen",
      "desc": "Gib ein neues Passwort für dein Konto ein.",
      "newPassword": "Neues Passwort",
      "confirmPassword": "Passwort bestätigen",
      "submit": "Passwort speichern",
      "success": "Passwort geändert",
      "successDesc": "Dein Passwort wurde erfolgreich geändert. Du wirst zur Anmeldung weitergeleitet.",
      "invalidToken": "Ungültiger Link",
      "invalidTokenDesc": "Dieser Link ist ungültig.",
      "expiredToken": "Link abgelaufen oder bereits genutzt",
      "expiredTokenDesc": "Bitte fordere einen neuen Link zum Zurücksetzen an.",
      "requestNew": "Neuen Link anfordern",
      "passwordRules": "Mindestens 8 Zeichen",
      "mismatch": "Passwörter stimmen nicht überein"
    },
    "contactAdmin": {
      "title": "Admin kontaktieren",
      "desc": "Schreibe eine Nachricht an den Administrator.",
      "email": "Deine E-Mail-Adresse",
      "subject": "Betreff",
      "message": "Nachricht",
      "submit": "Nachricht senden",
      "success": "Nachricht gesendet",
      "successDesc": "Deine Nachricht wurde an den Administrator weitergeleitet.",
      "error": "Nachricht konnte nicht gesendet werden. Bitte versuche es später erneut.",
      "rateLimit": "Zu viele Anfragen. Bitte warte 60 Sekunden.",
      "privacy": "Mit dem Absenden stimmst du der Verarbeitung deiner Daten (E-Mail, Betreff, Nachricht) zur Bearbeitung deiner Anfrage zu. Die Nachricht wird nicht gespeichert, sondern nur per E-Mail weitergeleitet."
    }
  },
  "report": {
    "filter": {
      "group_by": {
        "_": "Gruppieren nach",
        "project": "Projekt",
        "user": "Mitarbeiter",
        "both": "Projekt & Mitarbeiter"
      },
      "billable": {
        "_": "Abrechenbarkeit",
        "all": "Alle",
        "billable": "Nur abrechenbar",
        "non_billable": "Nur nicht abrechenbar",
        "ready_to_invoice": "Bereit zur Rechnungsstellung"
      },
      "date_from": "Von",
      "date_to": "Bis",
      "clients": "Kunden",
      "projects": "Projekte",
      "users": "Mitarbeiter",
      "no_clients": "Keine Kunden verfügbar",
      "no_projects": "Keine Projekte verfügbar",
      "no_users": "Keine Mitarbeiter verfügbar"
    },
    "preset": {
      "monthly_overview": {
        "_": "Monatliche Erfassungsübersicht",
        "description": "Gruppiert nach Monat / Mitarbeiter"
      },
      "planned_vs_actual": {
        "_": "Erfasst vs. geplant",
        "description": "Budget-Prüfung der Projekte"
      },
      "billable_by_user": {
        "_": "Abrechenbarkeit pro Mitarbeiter",
        "description": "Nur abrechenbare Zeiten"
      },
      "ready_to_invoice": {
        "_": "Bereit zur Rechnungsstellung",
        "description": "Abrechenbar und noch offen"
      }
    },
    "tab": {
      "hours": "Stundenauswertung",
      "billing": "Abrechnungs-Dashboard"
    },
    "summary": {
      "total_hours": "Gesamtstunden",
      "billable": "Abrechenbar",
      "total_budget": "Budget gesamt",
      "budget_used": "Budget genutzt",
      "hour_distribution": "Stundenverteilung",
      "detail_table": "Detailtabelle",
      "entries": "Einträge",
      "no_data": "Keine Daten für den ausgewählten Zeitraum gefunden.",
      "no_chart_data": "Keine Daten für Diagramm verfügbar"
    },
    "export": {
      "csv": "Als CSV exportieren",
      "excel": "Als Excel exportieren",
      "pdf": "Als PDF exportieren",
      "title": "Export"
    },
    "template": {
      "save": "Vorlage speichern",
      "load": "Vorlage laden",
      "delete": "Löschen",
      "name": "Vorlagenname",
      "no_name": "Bitte Namen eingeben",
      "saved": "Vorlage gespeichert",
      "empty": "Keine Vorlagen"
    },
    "table": {
      "project": "Projekt",
      "hours": "Stunden",
      "billable": "Abrechenbar",
      "tasks": "Tasks",
      "budget": "Budget"
    }
  },
  "billing": {
    "title": "Rechnungsbereite Projekte",
    "open_revenue": "Offener Umsatz",
    "billable_hours": "Abrechenbare Stunden",
    "ready_count": "Rechnungsbereit",
    "avg_per_project": "Ø pro Projekt",
    "invoice_template_title": "Rechnungsvorlage erstellen",
    "invoice_template_desc": "Wähle ein Projekt aus, um eine Rechnungsvorlage mit allen abrechenbaren Leistungen zu generieren. Die Vorlage kann als PDF gespeichert werden.",
    "print_service_record": "Leistungsnachweis",
    "project_count": "Projekte"
  },
  "pdf": {
    "service_record": {
      "title": "Leistungsnachweis"
    },
    "timesheet": {
      "title": "Stundenzettel"
    },
    "invoice": {
      "title": "Rechnung"
    },
    "col": {
      "date": "Datum",
      "description": "Leistung",
      "hours": "Stunden",
      "rate": "Satz",
      "amount": "Betrag",
      "employee": "Mitarbeiter",
      "activity": "Tätigkeit",
      "duration": "Dauer"
    },
    "sum_label": "Gesamt",
    "invoice_number": "Rechnungsnummer",
    "invoice_date": "Rechnungsdatum",
    "period": "Leistungszeitraum",
    "subtotal": "Zwischensumme",
    "vat": "MwSt.",
    "total": "Gesamtbetrag",
    "footer": "Vielen Dank für Ihren Auftrag.",
    "regenerated": "Wiederholter Abdruck",
    "your_company": "Ihr Unternehmen"
  },
  "time": {
    "manual_entry": "Zeiteintrag erfassen",
    "working_on": "Woran arbeitest du gerade?",
    "billable": "Abrechenbar",
    "set_start_time": "Startzeit manuell setzen",
    "add_description": "+ Beschreibung",
    "minimize": "Minimieren",
    "week_view": "Wochenansicht",
    "month_view": "Monatsansicht",
    "total_hours": "Gesamt erfasst",
    "filtered": "Gefiltert",
    "all_projects": "Alle Projekte",
    "no_entries": "Keine Zeiteinträge gefunden"
  },
  "planner": {
    "title": "Planer",
    "subtitle": "Zeitplan und Meilensteine aller Projekte im Überblick.",
    "sidebar_title": "Projektstruktur",
    "sidebar_empty": "Keine Aufgaben mit Datum",
    "view_day": "Tag",
    "view_week": "Woche",
    "view_month": "Monat",
    "view_year": "Jahr",
    "toolbar_label": "Ansicht",
    "gantt_popup_progress": "Fortschritt:",
    "loading": "Lade Gantt-Daten…",
    "error": "Fehler beim Laden der Gantt-Daten:",
    "empty": "Keine Aufgaben mit Datumsangaben vorhanden."
  },
  "task": {
    "status": {
      "todo": "Offen",
      "in_progress": "In Arbeit",
      "review": "Prüfung",
      "done": "Erledigt"
    },
    "priority": {
      "low": "Niedrig",
      "medium": "Mittel",
      "high": "Hoch",
      "acute": "Akut"
    },
    "column": {
      "title": "Aufgabe",
      "status": "Status",
      "priority": "Priorität",
      "assignee": "Zuständig",
      "due_date": "Fällig",
      "project": "Projekt"
    },
    "group_by_cycle": "Zyklen"
  },
  "project": {
    "budget_type": {
      "fixed": "Festpreis",
      "hourly": "Stundensatz",
      "retainer": "Retainer"
    },
    "status": {
      "active": "Aktiv",
      "completed": "Abgeschlossen",
      "archived": "Archiviert"
    }
  },
  "dashboard": {
    "title": "Dashboard",
    "subtitle": "Willkommen zurück! Alle Projekte im Überblick.",
    "kpi_open_tasks": "Offene Aufgaben",
    "kpi_total_hours": "Erfasste Stunden",
    "kpi_active_projects": "Aktive Projekte",
    "kpi_team_members": "Teammitglieder",
    "remaining_label": "Rest",
    "project_hours_alert": "Projekt-Stunden-Warnung",
    "select_project_hint": "Wähle ein Projekt aus, um Aufgaben und Zeiterfassung zu verwalten."
  },
  "role": {
    "admin": "Administrator",
    "manager": "Manager",
    "employee": "Mitarbeiter",
    "freelancer": "Freelancer",
    "client": "Kunde"
  },
  "team": {
    "title": "Team",
    "role_member": "Mitglied"
  },
  "notifications": {
    "title": "Benachrichtigungen",
    "unread_badge": "ungelesen",
    "subtitle": "Alle Benachrichtigungen auf einen Blick.",
    "mark_all_read": "Alle als gelesen markieren",
    "mark_read": "Als gelesen markieren",
    "mark_unread": "Als ungelesen markieren",
    "view": "Ansehen",
    "delete": "Löschen",
    "no_notifications": "Keine Benachrichtigungen",
    "empty": "Du hast noch keine Benachrichtigungen erhalten.",
    "filter_empty": "Keine Benachrichtigungen entsprechen deinen Filterkriterien.",
    "all_read": "Alle gelesen",
    "show_all": "Alle Benachrichtigungen anzeigen",
    "filter": {
      "type": "Typ",
      "status": "Status",
      "all_types": "Alle Typen",
      "all_statuses": "Alle",
      "unread": "Ungelesen",
      "read": "Gelesen"
    },
    "type": {
      "task_assigned": "Zugewiesen",
      "task_due": "Fälligkeit",
      "task_comment": "Kommentar",
      "task_mention": "Erwähnung",
      "status_change": "Statusänderung",
      "project_update": "Projektupdate"
    }
  },
  "client": {
    "status": {
      "noch_nicht_gestartet": "Noch nicht gestartet",
      "aktiv": "Aktiv",
      "beendet": "Beendet"
    }
  },
  "profile": {
    "password_title": "Passwort ändern",
    "password_desc": "Ändere dein Passwort für die Anmeldung",
    "notify_task_assign": "Aufgabenzuweisung",
    "notify_task_assign_desc": "Wenn dir eine Aufgabe zugewiesen wird",
    "notify_task_due": "Aufgaben-Fälligkeit",
    "notify_task_due_desc": "Wenn eine Aufgabe bald fällig ist",
    "avatar_too_large": "Datei zu groß",
    "language": "Sprache",
    "language_de": "Deutsch (German)",
    "language_en": "Englisch (English)",
    "preferences_title": "Persönliche Präferenzen",
    "preferences_desc": "Passe das Verhalten von Ansichten, Dichte und Benachrichtigungen an deinen Workflow an"
  },
  "timerbar": {
    "toast": {
      "resumed": "Timer fortgesetzt",
      "paused": "Timer pausiert",
      "select_task": "Bitte wähle eine Aufgabe aus",
      "started": "Timer gestartet für:",
      "started_at": "ab",
      "stopped": "Zeit erfasst:",
      "stopped_unit": "Min. für",
      "save_error": "Fehler beim Speichern der Zeit",
      "note_saved": "Notiz gespeichert",
      "note_save_error": "Fehler beim Speichern der Notiz"
    },
    "collapsed_label": "Timer",
    "title": {
      "resume": "Fortsetzen",
      "pause": "Pause",
      "minimize": "Minimieren",
      "expand": "Ausklappen",
      "not_billable": "Nicht abrechenbar",
      "set_start_time": "Startzeit manuell setzen"
    },
    "task_placeholder": "Woran arbeitest du gerade?",
    "task_search": "Aufgabe suchen...",
    "no_tasks": "Keine passenden Aufgaben gefunden",
    "billable": "Abrechenbar",
    "internal": "Intern",
    "backdate_title": "Startzeit zurückdatieren",
    "date_label": "Datum",
    "time_label": "Uhrzeit",
    "done": "Fertig",
    "add_description": "+ Beschreibung",
    "note_placeholder": "Notiz hinzufügen...",
    "zeroclaw_active": "Vibeforce Flow OS",
    "timer_inactive": "Timer nicht aktiv",
    "select_task_hint": "Wähle eine Aufgabe aus, um den Timer zu starten"
  },
  "ui": {
    "loading": "Lädt...",
    "error": "Fehler",
    "empty": "Keine Daten",
    "not_available": "--"
  },
  "craft": {
    "title": "VIBE Craft",
    "module_name": "Modul M007: VIBE Craft (Handwerk & Baustelle)",
    "geofence": {
      "title": "Geofence-Einstellungen",
      "mode_label": "Geofence-Modus",
      "type_none": "Kein Geofence",
      "type_circle": "Kreis-Radius",
      "type_polygon": "Polygon-Bereich",
      "radius_label": "Radius (Meter)",
      "center_label": "Mittelpunkt",
      "search_address": "Adresse suchen (Nominatim)…",
      "search_placeholder": "Straße, Stadt, PLZ...",
      "draw_polygon": "Polygon zeichnen",
      "clear_polygon": "Polygon zurücksetzen",
      "auto_prompt": "Automatischer Check-in-Vorschlag",
      "auto_prompt_desc": "Mitarbeiter beim Betreten der Baustelle fragen, ob der Timer gestartet werden soll",
      "prompt_title": "Baustelle erreicht!",
      "prompt_message": "Du befindest dich im Bereich von \"{project}\". Zeiterfassung jetzt starten?",
      "prompt_start": "Zeiterfassung starten",
      "prompt_dismiss": "Jetzt nicht",
      "saved_success": "Geofence-Einstellungen erfolgreich gespeichert",
      "save_button": "Geofence speichern"
    },
    "site_report": {
      "title": "Regie- & Bautagesberichte",
      "new": "Neuer Bericht",
      "edit": "Bericht bearbeiten",
      "status_draft": "Entwurf",
      "status_signed": "Vom Kunden signiert",
      "status_invoiced": "Abgerechnet",
      "date": "Berichtsdatum",
      "weather": "Wetterbedingungen",
      "temperature": "Temperatur (°C)",
      "work_performed": "Ausgeführte Arbeiten",
      "special_events": "Besondere Vorkommnisse / Behinderungen",
      "qualification_hours": "Stunden nach Qualifikation",
      "hours_meister": "Meisterstunden",
      "hours_geselle": "Gesellenstunden",
      "hours_helfer": "Helferstunden",
      "hours_azubi": "Azubistunden",
      "client_name": "Name des Auftraggebers / Bauleiters",
      "sign_now": "Vor Ort signieren",
      "sign_client": "Unterschrift Auftraggeber",
      "sign_contractor": "Unterschrift Auftragnehmer",
      "clear_signature": "Unterschrift löschen",
      "save_report": "Bericht speichern",
      "export_pdf": "Bautagesbericht als PDF",
      "generate_invoice": "ZUGFeRD-Rechnung erstellen",
      "no_reports": "Noch keine Regieberichte für dieses Projekt vorhanden.",
      "section_weather": "Rahmendaten & Wetterbedingungen",
      "section_activities": "Tätigkeitsbericht & Vorkommnisse",
      "section_qualification": "Stunden nach Qualifikation",
      "section_measurements": "VOB-Aufmaß & Massen",
      "section_evidence": "Fotodokumentation & Beweissicherung",
      "section_signature": "Digitale Abnahme & Vor-Ort-Signatur"
    },
    "measurement": {
      "title": "VOB-Aufmaß",
      "add_position": "Aufmaßposition hinzufügen",
      "position_nr": "Pos.-Nr.",
      "item_title": "Bezeichnung / Leistung",
      "formula": "Berechnungsformel (L × B × H)",
      "quantity": "Menge",
      "unit": "Einheit",
      "unit_price": "Einheitspreis (€)",
      "total_price": "Gesamtpreis (€)",
      "notes": "Anmerkungen / Abzug nach VOB",
      "unit_m": "m (Meter)",
      "unit_m2": "m² (Quadratmeter)",
      "unit_m3": "m³ (Kubikmeter)",
      "unit_h": "h (Stunden)",
      "unit_stk": "Stk (Stück)",
      "unit_kg": "kg (Kilogramm)",
      "unit_psch": "psch (Pauschal)",
      "no_measurements": "Keine Aufmaßpositionen erfasst.",
      "subtotal": "Zwischensumme",
      "vat": "MwSt. (19%)",
      "total": "Gesamt"
    },
    "evidence": {
      "title": "Bautagebuch & Fotodokumentation",
      "upload": "Beweisfoto aufnehmen / hochladen",
      "caption": "Bildbeschreibung / Mangelnotiz",
      "hash_label": "SHA-256 Integritätshash",
      "timestamp_label": "Aufnahmezeitpunkt",
      "gps_label": "GPS-Standort",
      "no_items": "Keine Fotos vorhanden."
    },
    "invoice": {
      "title": "ZUGFeRD E-Rechnung (EN16931)",
      "type_abschlag": "Abschlagsrechnung",
      "type_schluss": "Schlussrechnung",
      "type_standard": "Standardrechnung",
      "generate_xml": "ZUGFeRD 2.1.1 XML erzeugen",
      "invoice_number": "Rechnungsnummer",
      "net": "Nettobetrag",
      "tax": "Umsatzsteuer (19%)",
      "gross": "Bruttobetrag",
      "datev_export": "DATEV Buchungsstapel exportieren",
      "datev_success": "DATEV-Export erfolgreich erstellt"
    },
    "offline": {
      "status_online": "Online",
      "status_offline": "Offline — Änderungen werden lokal gespeichert",
      "sync_pending": "Ausstehende Synchronisierungen",
      "sync_now": "Jetzt synchronisieren",
      "sync_success": "Offline-Daten erfolgreich synchronisiert"
    }
  }
} as const;

export const enDict = {
  "nav": {
    "dashboard": "Dashboard",
    "my_tasks": "My Tasks",
    "my_times": "My Times",
    "planner": "Planner",
    "time_tracking": "Time Tracking",
    "clients": "Clients",
    "team": "Team",
    "admin": "Admin",
    "reports": "Time Reports",
    "notifications": "Notifications",
    "logout": "Sign Out",
    "aufgaben": "Tasks",
    "projekte": "Projects",
    "einstellungen": "Settings",
    "search_placeholder": "Search projects, tasks…",
    "sidebar_toggle": "Toggle Sidebar",
    "user_menu_profile": "Profile",
    "user_menu_settings": "Settings",
    "user_menu_logout_mobile": "Sign Out",
    "confirm_logout_title": "Sign out?",
    "confirm_logout_desc": "You will be signed out of your account.",
    "confirm_logout_cancel": "Cancel",
    "confirm_logout_confirm": "Sign Out",
    "user_role_member": "Member",
    "user_role_admin": "Admin",
    "night_shift": "Night Shift",
    "craft": "Craft & Construction",
    "docs": "User Manual & Help"
  },
  "action": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "new": "New",
    "close": "Close",
    "reset": "Reset",
    "confirm": "Confirm",
    "search": "Search",
    "filter": "Filter",
    "export": "Export",
    "download": "Download",
    "upload": "Upload",
    "generate": "Generate",
    "print": "Print"
  },
  "auth": {
    "login_title": "Vibeforce Flow OS",
    "login_subtitle": "The intelligent agency operating system.",
    "login_button": "Sign In",
    "login_error": "Sign in failed. Please check your credentials.",
    "email_label": "Email address",
    "password_label": "Password",
    "version": "Self-hosted — Vibeforce Flow OS v0.1",
    "login": {
      "title": "Vibeforce Flow OS",
      "subtitle": "The intelligent agency operating system.",
      "email": "Email address",
      "password": "Password",
      "forgot": "Forgot?",
      "submit": "Sign In",
      "noAccount": "Don't have access yet?",
      "contactAdmin": "Contact Admin",
      "selfHosted": "Self-hosted — Vibeforce Flow OS v0.1"
    },
    "forgotPassword": {
      "title": "Forgot Password",
      "desc": "Enter your email address. We will send you a link to reset your password.",
      "email": "Email address",
      "submit": "Send Link",
      "success": "Email Sent",
      "successDesc": "If an account exists with this email, a reset link has been sent. Please check your inbox.",
      "backToLogin": "Back to Sign In",
      "smtpError": "The email could not be sent. Please try again later or contact your administrator."
    },
    "resetPassword": {
      "title": "Reset Password",
      "desc": "Enter a new password for your account.",
      "newPassword": "New Password",
      "confirmPassword": "Confirm Password",
      "submit": "Save Password",
      "success": "Password Changed",
      "successDesc": "Your password has been changed successfully. Redirecting to sign in...",
      "invalidToken": "Invalid Link",
      "invalidTokenDesc": "This link is invalid.",
      "expiredToken": "Link expired or already used",
      "expiredTokenDesc": "Please request a new reset link.",
      "requestNew": "Request New Link",
      "passwordRules": "At least 8 characters",
      "mismatch": "Passwords do not match"
    },
    "contactAdmin": {
      "title": "Contact Admin",
      "desc": "Send a message to the administrator.",
      "email": "Your Email Address",
      "subject": "Subject",
      "message": "Message",
      "submit": "Send Message",
      "success": "Message Sent",
      "successDesc": "Your message has been forwarded to the administrator.",
      "error": "Failed to send message. Please try again later.",
      "rateLimit": "Too many requests. Please wait 60 seconds.",
      "privacy": "By submitting, you agree to processing your data (email, subject, message) to handle your request. Messages are forwarded via email and not stored."
    }
  },
  "report": {
    "filter": {
      "group_by": {
        "_": "Group by",
        "project": "Project",
        "user": "Member",
        "both": "Project & Member"
      },
      "billable": {
        "_": "Billability",
        "all": "All",
        "billable": "Billable only",
        "non_billable": "Non-billable only",
        "ready_to_invoice": "Ready to invoice"
      },
      "date_from": "From",
      "date_to": "To",
      "clients": "Clients",
      "projects": "Projects",
      "users": "Members",
      "no_clients": "No clients available",
      "no_projects": "No projects available",
      "no_users": "No members available"
    },
    "preset": {
      "monthly_overview": {
        "_": "Monthly Overview",
        "description": "Grouped by month / member"
      },
      "planned_vs_actual": {
        "_": "Logged vs. Planned",
        "description": "Project budget validation"
      },
      "billable_by_user": {
        "_": "Billability per Member",
        "description": "Billable hours only"
      },
      "ready_to_invoice": {
        "_": "Ready to Invoice",
        "description": "Billable and unbilled hours"
      }
    },
    "tab": {
      "hours": "Hour Analysis",
      "billing": "Billing Dashboard"
    },
    "summary": {
      "total_hours": "Total Hours",
      "billable": "Billable",
      "total_budget": "Total Budget",
      "budget_used": "Budget Used",
      "hour_distribution": "Hour Distribution",
      "detail_table": "Detail Table",
      "entries": "Entries",
      "no_data": "No data found for the selected time range.",
      "no_chart_data": "No chart data available"
    },
    "export": {
      "csv": "Export as CSV",
      "excel": "Export as Excel",
      "pdf": "Export as PDF",
      "title": "Export"
    },
    "template": {
      "save": "Save Template",
      "load": "Load Template",
      "delete": "Delete",
      "name": "Template Name",
      "no_name": "Please enter name",
      "saved": "Template saved",
      "empty": "No templates"
    },
    "table": {
      "project": "Project",
      "hours": "Hours",
      "billable": "Billable",
      "tasks": "Tasks",
      "budget": "Budget"
    }
  },
  "billing": {
    "title": "Projects Ready for Invoicing",
    "open_revenue": "Open Revenue",
    "billable_hours": "Billable Hours",
    "ready_count": "Ready to Invoice",
    "avg_per_project": "Ø per Project",
    "invoice_template_title": "Create Invoice Template",
    "invoice_template_desc": "Select a project to generate an invoice template with all billable items. The template can be saved as PDF.",
    "print_service_record": "Service Record",
    "project_count": "Projects"
  },
  "pdf": {
    "service_record": {
      "title": "Service Record"
    },
    "timesheet": {
      "title": "Timesheet"
    },
    "invoice": {
      "title": "Invoice"
    },
    "col": {
      "date": "Date",
      "description": "Service",
      "hours": "Hours",
      "rate": "Rate",
      "amount": "Amount",
      "employee": "Member",
      "activity": "Activity",
      "duration": "Duration"
    },
    "sum_label": "Total",
    "invoice_number": "Invoice Number",
    "invoice_date": "Invoice Date",
    "period": "Service Period",
    "subtotal": "Subtotal",
    "vat": "VAT",
    "total": "Total",
    "footer": "Thank you for your business.",
    "regenerated": "Reprint",
    "your_company": "Your Company"
  },
  "time": {
    "manual_entry": "Log Time Entry",
    "working_on": "What are you working on?",
    "billable": "Billable",
    "set_start_time": "Set start time manually",
    "add_description": "+ Description",
    "minimize": "Minimize",
    "week_view": "Week View",
    "month_view": "Month View",
    "total_hours": "Total Logged",
    "filtered": "Filtered",
    "all_projects": "All Projects",
    "no_entries": "No time entries found"
  },
  "planner": {
    "title": "Planner",
    "subtitle": "Project schedules and milestones at a glance.",
    "sidebar_title": "Project Structure",
    "sidebar_empty": "No tasks with dates",
    "view_day": "Day",
    "view_week": "Week",
    "view_month": "Month",
    "view_year": "Year",
    "toolbar_label": "View",
    "gantt_popup_progress": "Progress:",
    "loading": "Loading Gantt data…",
    "error": "Error loading Gantt data:",
    "empty": "No tasks with dates found."
  },
  "task": {
    "status": {
      "todo": "To Do",
      "in_progress": "In Progress",
      "review": "Review",
      "done": "Done"
    },
    "priority": {
      "low": "Low",
      "medium": "Medium",
      "high": "High",
      "acute": "Acute"
    },
    "column": {
      "title": "Task",
      "status": "Status",
      "priority": "Priority",
      "assignee": "Assignee",
      "due_date": "Due Date",
      "project": "Project"
    },
    "group_by_cycle": "Cycles"
  },
  "project": {
    "budget_type": {
      "fixed": "Fixed Price",
      "hourly": "Hourly Rate",
      "retainer": "Retainer"
    },
    "status": {
      "active": "Active",
      "completed": "Completed",
      "archived": "Archived"
    }
  },
  "dashboard": {
    "title": "Dashboard",
    "subtitle": "Welcome back! All projects at a glance.",
    "kpi_open_tasks": "Open Tasks",
    "kpi_total_hours": "Logged Hours",
    "kpi_active_projects": "Active Projects",
    "kpi_team_members": "Team Members",
    "remaining_label": "Remaining",
    "project_hours_alert": "Project Hours Alert",
    "select_project_hint": "Select a project to manage tasks and time tracking."
  },
  "role": {
    "admin": "Administrator",
    "manager": "Manager",
    "employee": "Employee",
    "freelancer": "Freelancer",
    "client": "Client"
  },
  "team": {
    "title": "Team",
    "role_member": "Member"
  },
  "notifications": {
    "title": "Notifications",
    "unread_badge": "unread",
    "subtitle": "All notifications at a glance.",
    "mark_all_read": "Mark all as read",
    "mark_read": "Mark as read",
    "mark_unread": "Mark as unread",
    "view": "View",
    "delete": "Delete",
    "no_notifications": "No notifications",
    "empty": "You have not received any notifications yet.",
    "filter_empty": "No notifications match your filters.",
    "all_read": "All read",
    "show_all": "Show all notifications",
    "filter": {
      "type": "Type",
      "status": "Status",
      "all_types": "All Types",
      "all_statuses": "All",
      "unread": "Unread",
      "read": "Read"
    },
    "type": {
      "task_assigned": "Assigned",
      "task_due": "Due Date",
      "task_comment": "Comment",
      "task_mention": "Mention",
      "status_change": "Status Change",
      "project_update": "Project Update"
    }
  },
  "client": {
    "status": {
      "noch_nicht_gestartet": "Not Started",
      "aktiv": "Active",
      "beendet": "Completed"
    }
  },
  "profile": {
    "password_title": "Change Password",
    "password_desc": "Update your sign in password",
    "notify_task_assign": "Task Assignment",
    "notify_task_assign_desc": "When a task is assigned to you",
    "notify_task_due": "Task Due Date",
    "notify_task_due_desc": "When a task is due soon",
    "avatar_too_large": "File too large",
    "language": "Language",
    "language_de": "German (Deutsch)",
    "language_en": "English (English)",
    "preferences_title": "Personal Preferences",
    "preferences_desc": "Customize view behavior, density and notifications for your workflow"
  },
  "timerbar": {
    "toast": {
      "resumed": "Timer resumed",
      "paused": "Timer paused",
      "select_task": "Please select a task",
      "started": "Timer started for:",
      "started_at": "at",
      "stopped": "Time recorded:",
      "stopped_unit": "min for",
      "save_error": "Error saving time",
      "note_saved": "Note saved",
      "note_save_error": "Error saving note"
    },
    "collapsed_label": "Timer",
    "title": {
      "resume": "Resume",
      "pause": "Pause",
      "minimize": "Minimize",
      "expand": "Expand",
      "not_billable": "Non-billable",
      "set_start_time": "Set start time manually"
    },
    "task_placeholder": "What are you working on?",
    "task_search": "Search task...",
    "no_tasks": "No matching tasks found",
    "billable": "Billable",
    "internal": "Internal",
    "backdate_title": "Backdate start time",
    "date_label": "Date",
    "time_label": "Time",
    "done": "Done",
    "add_description": "+ Description",
    "note_placeholder": "Add note...",
    "zeroclaw_active": "Vibeforce Flow OS",
    "timer_inactive": "Timer inactive",
    "select_task_hint": "Select a task to start the timer"
  },
  "ui": {
    "loading": "Loading...",
    "error": "Error",
    "empty": "No data",
    "not_available": "--"
  },
  "craft": {
    "title": "VIBE Craft",
    "module_name": "Module M007: VIBE Craft (Craft & Construction)",
    "geofence": {
      "title": "Geofence Settings",
      "mode_label": "Geofence Mode",
      "type_none": "No Geofence",
      "type_circle": "Circle Radius",
      "type_polygon": "Polygon Area",
      "radius_label": "Radius (Meters)",
      "center_label": "Center Point",
      "search_address": "Search address (Nominatim)…",
      "search_placeholder": "Street, city, postal code...",
      "draw_polygon": "Draw polygon",
      "clear_polygon": "Reset polygon",
      "auto_prompt": "Automatic Check-in Prompt",
      "auto_prompt_desc": "Ask members upon entering the site whether to start time tracking",
      "prompt_title": "Construction site reached!",
      "prompt_message": "You are within the perimeter of \"{project}\". Start time tracking now?",
      "prompt_start": "Start Time Tracking",
      "prompt_dismiss": "Not now",
      "saved_success": "Geofence settings saved successfully",
      "save_button": "Save Geofence"
    },
    "site_report": {
      "title": "Daily Site & Regie Reports",
      "new": "New Report",
      "edit": "Edit Report",
      "status_draft": "Draft",
      "status_signed": "Signed by Client",
      "status_invoiced": "Invoiced",
      "date": "Report Date",
      "weather": "Weather Conditions",
      "temperature": "Temperature (°C)",
      "work_performed": "Work Performed",
      "special_events": "Special Incidents / Obstacles",
      "qualification_hours": "Hours by Qualification",
      "hours_meister": "Master Hours",
      "hours_geselle": "Journeyman Hours",
      "hours_helfer": "Helper Hours",
      "hours_azubi": "Apprentice Hours",
      "client_name": "Name of Client / Site Manager",
      "sign_now": "Sign On-Site",
      "sign_client": "Client Signature",
      "sign_contractor": "Contractor Signature",
      "clear_signature": "Clear Signature",
      "save_report": "Save Report",
      "export_pdf": "Daily Site Report as PDF",
      "generate_invoice": "Generate ZUGFeRD Invoice",
      "no_reports": "No site reports found for this project.",
      "section_weather": "Conditions & Weather",
      "section_activities": "Activity Report & Incidents",
      "section_qualification": "Hours by Qualification",
      "section_measurements": "VOB Measurement & Quantities",
      "section_evidence": "Photo Documentation & Evidence",
      "section_signature": "Digital Acceptance & On-Site Signature"
    },
    "measurement": {
      "title": "VOB Measurement",
      "add_position": "Add Position",
      "position_nr": "Pos. No.",
      "item_title": "Description / Service",
      "formula": "Calculation Formula (L × W × H)",
      "quantity": "Quantity",
      "unit": "Unit",
      "unit_price": "Unit Price (€)",
      "total_price": "Total Price (€)",
      "notes": "Notes / Deductions per VOB",
      "unit_m": "m (Meters)",
      "unit_m2": "m² (Square Meters)",
      "unit_m3": "m³ (Cubic Meters)",
      "unit_h": "h (Hours)",
      "unit_stk": "pcs (Pieces)",
      "unit_kg": "kg (Kilograms)",
      "unit_psch": "lump (Lump Sum)",
      "no_measurements": "No measurement items recorded.",
      "subtotal": "Subtotal",
      "vat": "VAT (19%)",
      "total": "Total"
    },
    "evidence": {
      "title": "Site Diary & Photo Documentation",
      "upload": "Take / Upload Evidence Photo",
      "caption": "Image Description / Defect Note",
      "hash_label": "SHA-256 Integrity Hash",
      "timestamp_label": "Timestamp",
      "gps_label": "GPS Location",
      "no_items": "No photos available."
    },
    "invoice": {
      "title": "ZUGFeRD E-Invoice (EN16931)",
      "type_abschlag": "Progress Invoice",
      "type_schluss": "Final Invoice",
      "type_standard": "Standard Invoice",
      "generate_xml": "Generate ZUGFeRD 2.1.1 XML",
      "invoice_number": "Invoice Number",
      "net": "Net Amount",
      "tax": "VAT (19%)",
      "gross": "Gross Amount",
      "datev_export": "Export DATEV Booking Batch",
      "datev_success": "DATEV export created successfully"
    },
    "offline": {
      "status_online": "Online",
      "status_offline": "Offline — Changes saved locally",
      "sync_pending": "Pending Synchronizations",
      "sync_now": "Sync Now",
      "sync_success": "Offline data synchronized successfully"
    }
  }
} as const;

// Legacy alias for backward compatibility
export const dict = deDict;

export type TranslationKey = Paths<typeof deDict>;

// ─────────────────────────────────────────────
// Failsafe Translation Lookup via Dot Notation
// ─────────────────────────────────────────────

export function t(path: TranslationKey, lang?: UserLanguage): string {
  let activeLang: UserLanguage = lang || 'de';
  if (!lang && typeof window !== 'undefined') {
    try {
      const storeLang = useSettingsStore.getState().language;
      if (storeLang) activeLang = storeLang;
      else {
        const stored = localStorage.getItem('vibeforce-language') as UserLanguage;
        if (stored === 'de' || stored === 'en') activeLang = stored;
      }
    } catch {
      activeLang = 'de';
    }
  }

  const targetDict = activeLang === 'en' ? enDict : deDict;
  const keys = path.split('.');
  let result: any = targetDict;

  for (const key of keys) {
    if (result === undefined || result[key] === undefined) {
      // Fallback to German if missing in requested language
      let fallback: any = deDict;
      for (const fk of keys) {
        if (fallback === undefined || fallback[fk] === undefined) break;
        fallback = fallback[fk];
      }
      if (typeof fallback === 'string') return fallback;

      console.warn(`[i18n] Missing translation: "${path}" for "${activeLang}"`);
      return path;
    }
    result = result[key];
  }

  return typeof result === 'string' ? result : path;
}

// ─────────────────────────────────────────────
// React Hook: useI18n (Hydration-Safe & Reactive)
// ─────────────────────────────────────────────

export function useI18n() {
  const language = useSettingsStore((s) => s.language) || 'de';
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  const translate = useCallback(
    (path: TranslationKey, overrideLang?: UserLanguage) => {
      return t(path, overrideLang || language);
    },
    [language]
  );

  return {
    t: translate,
    language,
    setLanguage,
  };
}

// ─────────────────────────────────────────────
// Multi-Lingual Helper Functions & Option Arrays
// ─────────────────────────────────────────────

export function getGroupByOptions(lang?: UserLanguage) {
  return [
    { value: 'project' as const, label: t('report.filter.group_by.project', lang) },
    { value: 'user' as const, label: t('report.filter.group_by.user', lang) },
    { value: 'both' as const, label: t('report.filter.group_by.both', lang) },
  ] as const;
}

export function getBillableFilterOptions(lang?: UserLanguage) {
  return [
    { value: 'all' as const, label: t('report.filter.billable.all', lang) },
    { value: 'billable' as const, label: t('report.filter.billable.billable', lang) },
    { value: 'non_billable' as const, label: t('report.filter.billable.non_billable', lang) },
    { value: 'ready_to_invoice' as const, label: t('report.filter.billable.ready_to_invoice', lang) },
  ] as const;
}

// Backward-compatible static arrays
export const GROUP_BY_OPTIONS = getGroupByOptions('de');
export const BILLABLE_FILTER_OPTIONS = getBillableFilterOptions('de');

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
