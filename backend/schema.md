# PocketBase Datenmodell & Collections (Auto-generated)

> **WICHTIG FUR KI-AGENTEN:** Dies ist die Single Source of Truth fur alle Datenbank-Queries und Typisierungen. Niemals das Schema erraten!

## Collection: `_mfas` (Typ: base)
| Feldname | Typ | Details / Relationen |
| :--- | :--- | :--- |
| `id` | **text** | Required |
| `collectionRef` | **text** | Required |
| `recordRef` | **text** | Required |
| `method` | **text** | Required |
| `created` | **autodate** | - |
| `updated` | **autodate** | - |

## Collection: `_otps` (Typ: base)
| Feldname | Typ | Details / Relationen |
| :--- | :--- | :--- |
| `id` | **text** | Required |
| `collectionRef` | **text** | Required |
| `recordRef` | **text** | Required |
| `password` | **password** | Required |
| `sentTo` | **text** | - |
| `created` | **autodate** | - |
| `updated` | **autodate** | - |

## Collection: `_externalAuths` (Typ: base)
| Feldname | Typ | Details / Relationen |
| :--- | :--- | :--- |
| `id` | **text** | Required |
| `collectionRef` | **text** | Required |
| `recordRef` | **text** | Required |
| `provider` | **text** | Required |
| `providerId` | **text** | Required |
| `created` | **autodate** | - |
| `updated` | **autodate** | - |

## Collection: `_authOrigins` (Typ: base)
| Feldname | Typ | Details / Relationen |
| :--- | :--- | :--- |
| `id` | **text** | Required |
| `collectionRef` | **text** | Required |
| `recordRef` | **text** | Required |
| `fingerprint` | **text** | Required |
| `created` | **autodate** | - |
| `updated` | **autodate** | - |

## Collection: `_superusers` (Typ: auth)
| Feldname | Typ | Details / Relationen |
| :--- | :--- | :--- |
| `id` | **text** | Required |
| `password` | **password** | Required |
| `tokenKey` | **text** | Required |
| `email` | **email** | Required |
| `emailVisibility` | **bool** | - |
| `verified` | **bool** | - |
| `created` | **autodate** | - |
| `updated` | **autodate** | - |

## Collection: `users` (Typ: auth)
| Feldname | Typ | Details / Relationen |
| :--- | :--- | :--- |
| `id` | **text** | Required |
| `password` | **password** | Required |
| `tokenKey` | **text** | Required |
| `email` | **email** | Required |
| `emailVisibility` | **bool** | - |
| `verified` | **bool** | - |
| `name` | **text** | - |
| `first_name` | **text** | - |
| `last_name` | **text** | - |
| `avatar` | **file** | - |
| `created` | **autodate** | - |
| `updated` | **autodate** | - |
| `role` | **select** | Required |
| `hourly_rate` | **number** | - |
| `language` | **select** | - |
| `notify_on_assignment` | **bool** | - |
| `notify_on_mention` | **bool** | - |
| `notify_on_due` | **bool** | - |
| `weekly_report` | **bool** | - |
| `expertise` | **select** | - |
| `deactivated` | **bool** | - |

## Collection: `projects` (Typ: base)
| Feldname | Typ | Details / Relationen |
| :--- | :--- | :--- |
| `id` | **text** | Required |
| `key` | **text** | Required |
| `name` | **text** | Required |
| `description` | **editor** | - |
| `status` | **select** | - |
| `budget_hours` | **number** | - |
| `budget_money` | **number** | - |
| `members` | **relation** | - |
| `created` | **autodate** | - |
| `updated` | **autodate** | - |
| `client` | **relation** | - |
| `budget_fixed` | **number** | - |
| `budget_type` | **select** | - |
| `external_costs_total` | **number** | - |
| `cycle_number` | **number** | - |
| `start_date` | **date** | - |
| `due_date` | **date** | - |

## Collection: `tasks` (Typ: base)
| Feldname | Typ | Details / Relationen |
| :--- | :--- | :--- |
| `id` | **text** | Required |
| `project` | **relation** | Required |
| `title` | **text** | Required |
| `description` | **editor** | - |
| `status` | **select** | Required |
| `priority` | **select** | Required |
| `assignees` | **relation** | - |
| `start_date` | **date** | - |
| `due_date` | **date** | - |
| `parent_task` | **relation** | - |
| `created` | **autodate** | - |
| `updated` | **autodate** | - |
| `is_recurring` | **bool** | - |
| `recurring_custom_days` | **number** | - |
| `recurring_end_date` | **date** | - |
| `recurring_next_date` | **date** | - |
| `type` | **select** | - |
| `estimated_hours` | **number** | - |

## Collection: `time_entries` (Typ: base)
| Feldname | Typ | Details / Relationen |
| :--- | :--- | :--- |
| `id` | **text** | Required |
| `task` | **relation** | Required |
| `user` | **relation** | Required |
| `start_time` | **date** | Required |
| `end_time` | **date** | - |
| `duration_minutes` | **number** | - |
| `is_billable` | **bool** | - |
| `description` | **text** | - |
| `created` | **autodate** | - |
| `updated` | **autodate** | - |
| `is_billed` | **bool** | - |
| `billing_reference` | **text** | - |

## Collection: `clients` (Typ: base)
| Feldname | Typ | Details / Relationen |
| :--- | :--- | :--- |
| `id` | **text** | Required |
| `name` | **text** | Required |
| `company` | **text** | - |
| `email` | **text** | - |
| `phone` | **text** | - |
| `address` | **text** | - |
| `notes` | **editor** | - |
| `status` | **select** | - |
| `created` | **autodate** | - |
| `updated` | **autodate** | - |
| `auftragsvolumen` | **number** | - |
| `stundenhonorar` | **number** | - |
| `stundenzahl_monatlich` | **number** | - |
| `stundenzahl_gesamt` | **number** | - |
| `laufzeit_start` | **date** | - |
| `laufzeit_ende` | **date** | - |
| `abrechenbar` | **bool** | - |
| `kundenstatus` | **select** | - |
| `betreuer` | **relation** | - |
| `beobachter` | **relation** | - |

## Collection: `notifications` (Typ: base)
| Feldname | Typ | Details / Relationen |
| :--- | :--- | :--- |
| `id` | **text** | Required |
| `user` | **relation** | Required |
| `type` | **select** | Required |
| `title` | **text** | Required |
| `message` | **text** | Required |
| `read` | **bool** | - |
| `link` | **text** | - |
| `created` | **autodate** | - |
| `updated` | **autodate** | - |
| `email_sent` | **bool** | - |

## Collection: `task_links` (Typ: base)
| Feldname | Typ | Details / Relationen |
| :--- | :--- | :--- |
| `id` | **text** | Required |
| `source_task` | **relation** | Required |
| `target_task` | **relation** | Required |
| `link_type` | **select** | Required |
| `created` | **autodate** | - |
| `updated` | **autodate** | - |

## Collection: `checklist_items` (Typ: base)
| Feldname | Typ | Details / Relationen |
| :--- | :--- | :--- |
| `id` | **text** | Required |
| `task` | **relation** | Required |
| `title` | **text** | Required |
| `completed` | **bool** | - |
| `sort_order` | **number** | - |
| `created` | **autodate** | - |
| `updated` | **autodate** | - |

## Collection: `task_comments` (Typ: base)
| Feldname | Typ | Details / Relationen |
| :--- | :--- | :--- |
| `id` | **text** | Required |
| `task` | **relation** | Required |
| `author` | **relation** | Required |
| `content` | **editor** | Required |
| `mentions` | **json** | - |
| `created` | **autodate** | - |
| `updated` | **autodate** | - |

## Collection: `report_templates` (Typ: base)
| Feldname | Typ | Details / Relationen |
| :--- | :--- | :--- |
| `id` | **text** | Required |
| `name` | **text** | Required |
| `user` | **relation** | Required |
| `config` | **json** | - |
| `created` | **autodate** | - |
| `updated` | **autodate** | - |

## Collection: `task_files` (Typ: base)
| Feldname | Typ | Details / Relationen |
| :--- | :--- | :--- |
| `id` | **text** | Required |
| `task` | **relation** | Required |
| `file` | **file** | Required |
| `name` | **text** | - |
| `size` | **number** | - |
| `created` | **autodate** | - |
| `updated` | **autodate** | - |

## Collection: `external_expenses` (Typ: base)
| Feldname | Typ | Details / Relationen |
| :--- | :--- | :--- |
| `id` | **text** | Required |
| `project` | **relation** | Required |
| `amount` | **number** | Required |
| `description` | **text** | - |
| `category` | **text** | - |
| `created` | **autodate** | - |
| `updated` | **autodate** | - |

## Collection: `app_settings` (Typ: base)
| Feldname | Typ | Details / Relationen |
| :--- | :--- | :--- |
| `id` | **text** | Required |
| `app_name` | **text** | Required |
| `app_logo_url` | **text** | - |
| `smtp_host` | **text** | - |
| `smtp_port` | **number** | - |
| `smtp_username` | **text** | - |
| `smtp_password` | **text** | - |
| `smtp_from_address` | **text** | - |
| `smtp_from_name` | **text** | - |
| `smtp_tls` | **bool** | - |
| `created` | **autodate** | - |
| `updated` | **autodate** | - |

## Collection: `commands` (Typ: base)
| Feldname | Typ | Details / Relationen |
| :--- | :--- | :--- |
| `id` | **text** | Required |
| `source` | **text** | Required |
| `target` | **text** | Required |
| `command` | **text** | Required |
| `payload` | **json** | - |
| `status` | **select** | Required |
| `created` | **autodate** | - |
| `updated` | **autodate** | - |

## Collection: `command_results` (Typ: base)
| Feldname | Typ | Details / Relationen |
| :--- | :--- | :--- |
| `id` | **text** | Required |
| `command_id` | **relation** | Required |
| `result` | **json** | - |
| `error` | **text** | - |
| `duration_ms` | **number** | - |
| `created` | **autodate** | - |
| `updated` | **autodate** | - |

## Collection: `time_entry_reports` (Typ: base)
| Feldname | Typ | Details / Relationen |
| :--- | :--- | :--- |
| `id` | **text** | Required |
| `time_entry` | **relation** | Required |
| `file` | **file** | Required |
| `title` | **text** | - |
| `size` | **number** | - |
| `created` | **autodate** | - |
| `updated` | **autodate** | - |

## Collection: `audit_logs` (Typ: base)
| Feldname | Typ | Details / Relationen |
| :--- | :--- | :--- |
| `id` | **text** | Required |
| `action` | **text** | Required |
| `entity_type` | **text** | Required |
| `entity_id` | **text** | - |
| `summary` | **text** | Required |
| `metadata` | **json** | - |
| `user` | **relation** | - |
| `created` | **autodate** | - |
| `updated` | **autodate** | - |

## Collection: `teams` (Typ: base)
| Feldname | Typ | Details / Relationen |
| :--- | :--- | :--- |
| `id` | **text** | Required |
| `name` | **text** | Required |
| `description` | **text** | - |
| `lead` | **relation** | - |
| `created` | **autodate** | - |
| `updated` | **autodate** | - |

## Collection: `team_members` (Typ: base)
| Feldname | Typ | Details / Relationen |
| :--- | :--- | :--- |
| `id` | **text** | Required |
| `team` | **relation** | Required |
| `user` | **relation** | Required |
| `role` | **select** | - |
| `created` | **autodate** | - |
| `updated` | **autodate** | - |

## Collection: `site_reports` (Typ: base)
| Feldname | Typ | Details / Relationen |
| :--- | :--- | :--- |
| `id` | **text** | Required |
| `project` | **relation** | Required -> `projects` |
| `author` | **relation** | Required -> `users` |
| `report_date` | **text** | Required (YYYY-MM-DD) |
| `status` | **text** | `draft`, `signed`, `invoiced` |
| `weather` | **text** | - |
| `temperature` | **number** | - |
| `work_performed` | **text** | GoBD Append-Only Nachtrag |
| `special_events` | **text** | - |
| `qualification_hours` | **json** | Record<QualificationLevel, number> |
| `client_name` | **text** | - |
| `client_signature` | **text** | PNG DataURL |
| `client_signed_at` | **text** | ISO Timestamp |
| `contractor_signature` | **text** | PNG DataURL |
| `contractor_signed_at` | **text** | ISO Timestamp |
| `signature_manifest` | **text** | JSON Manifest SHA-256 |
| `signature_strokes` | **json** | Biometrische Vektordaten number[][][] |
| `gps_lat` | **number** | Geokoordinate Latitude |
| `gps_lon` | **number** | Geokoordinate Longitude |
| `gps_accuracy` | **number** | Genauigkeit in Metern |
| `created` | **autodate** | - |
| `updated` | **autodate** | - |

## Collection: `measurements` (Typ: base)
| Feldname | Typ | Details / Relationen |
| :--- | :--- | :--- |
| `id` | **text** | Required |
| `site_report` | **relation** | Required -> `site_reports` |
| `position_nr` | **text** | z.B. "01" |
| `title` | **text** | Required |
| `formula` | **text** | VOB Aufmaßformel z.B. "2.50 * 4.20 * 0.15" |
| `quantity` | **number** | Berechnete Menge |
| `unit` | **text** | m, m2, m3, h, stk, kg, psch |
| `unit_price` | **number** | Einzelpreis |
| `total_price` | **number** | Gesamtpreis |
| `tax_rate_type` | **text** | standard_19, reverse_charge_13b |
| `notes` | **text** | - |
| `created` | **autodate** | - |
| `updated` | **autodate** | - |

## Collection: `evidence_items` (Typ: base)
| Feldname | Typ | Details / Relationen |
| :--- | :--- | :--- |
| `id` | **text** | Required |
| `site_report` | **relation** | Required -> `site_reports` |
| `image` | **file** | JPG/PNG/WebP max 10MB |
| `caption` | **text** | - |
| `sha256_hash` | **text** | GoBD-Fingerprint |
| `taken_at` | **text** | ISO Timestamp |
| `gps_lat` | **number** | - |
| `gps_lon` | **number** | - |
| `created` | **autodate** | - |
| `updated` | **autodate** | - |

## Collection: `invoices_zugferd` (Typ: base)
| Feldname | Typ | Details / Relationen |
| :--- | :--- | :--- |
| `id` | **text** | Required |
| `site_report` | **relation** | Optional -> `site_reports` |
| `project` | **relation** | Required -> `projects` |
| `invoice_number` | **text** | Required |
| `invoice_type` | **text** | standard, abschlag, schluss |
| `net_total` | **number** | Netto-Rechnungsbetrag |
| `tax_rate` | **number** | Steuersatz |
| `tax_total` | **number** | Steuerbetrag |
| `gross_total` | **number** | Bruttobetrag |
| `prepaid_amount` | **number** | Kumulierte VOB-Abschläge BT-113 |
| `zugferd_xml` | **text** | ZUGFeRD 2.1.1 BASIC WL XML |
| `pdf_file` | **file** | PDF/A Rechnung |
| `datev_exported` | **bool** | - |
| `datev_export_date` | **text** | - |
| `created` | **autodate** | - |
| `updated` | **autodate** | - |


