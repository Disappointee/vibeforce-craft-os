# 📘 Benutzer- & Administrator-Handbuch: Vibeforce Craft OS
## Das digitale Betriebssystem für Handwerk, Bauleitung & Meisterbetriebe

> **Version:** 2.5 Enterprise Edition  
> **Normen- & Rechtsstand:** VOB/B (2026), VOB/C, DIN 18299, § 13b UStG, ZUGFeRD 2.1.1 (EN 16931), DATEV EXTF700  
> **Zielgruppe:** Handwerksmeister, Bauleiter, Vorarbeiter, Poliere, kaufmännische Angestellte und IT-Verantwortliche  
> **System-URL:** [https://craft-vibeforce.vercel.app](https://craft-vibeforce.vercel.app)

---

## Inhaltsverzeichnis
1. [Systemarchitektur & Dual-Stack Prinzip](#1-systemarchitektur--dual-stack-prinzip)
2. [Erste Schritte & Meister-Login](#2-erste-schritte--meister-login)
3. [Die Handwerks-Zentrale (`/craft`)](#3-die-handwerks-zentrale-craft)
4. [Baustellenverwaltung & Bauvorhaben (`/projects`)](#4-baustellenverwaltung--bauvorhaben-projects)
5. [Die digitale Baustellen-Akte (`/projects/[id]`)](#5-die-digitale-baustellen-akte-projectsid)
   * 5.1 [Bautagebuch & VOB/B § 6 Behinderungsmanagement](#51-bautagebuch--vobb--6-behinderungsmanagement)
   * 5.2 [VOB-Aufmaßblatt nach DIN 18299 mit Formel-Parser](#52-vob-aufmaßblatt-nach-din-18299-mit-formel-parser)
   * 5.3 [Margen- & Soll/Ist-Nachkalkulation](#53-margen--sollist-nachkalkulation)
   * 5.4 [GAEB / Leistungsverzeichnis (X83 / X84)](#54-gaeb--leistungsverzeichnis-x83--x84)
   * 5.5 [GPS-Geofencing & Baustellenradius](#55-gps-geofencing--baustellenradius)
   * 5.6 [Plan-Pinning & Mängelverortung](#56-plan-pinning--mängelverortung)
6. [ZUGFeRD 2.1.1 E-Rechnung & DATEV-Schnittstelle](#6-zugferd-211-e-rechnung--datev-schnittstelle)
7. [Großhandels-Anbindung über IDS-Connect 2.5](#7-großhandels-anbindung-über-ids-connect-25)
8. [Monteur-Stempeluhr, Mobile Nutzung & Offline-Modus](#8-monteur-stempeluhr-mobile-nutzung--offline-modus)
9. [Administration, Rollen & Berechtigungen](#9-administration-rollen--berechtigungen)
10. [Häufige Fragen (FAQ) & Troubleshooting](#10-häufige-fragen-faq--troubleshooting)

---

## 1. Systemarchitektur & Dual-Stack Prinzip

Vibeforce One basiert auf einer **Single-Engine Dual-Stack Architektur**: Ein einziger hochmoderner Next.js 16 Kern bedient zwei komplett getrennte Geschäftswelten:
1. **Flow OS (`agency`):** Das digitale Agentur- und Projektmanagement-System für Marketing, Beratung und Softwarehäuser.
2. **Craft OS (`craft`):** Das spezialisierte deutsche Handwerks- und Baustellen-Betriebssystem.

### Automatische Hostname-Erkennung
Das System erkennt automatisch anhand der Domain, in welcher Ausprägung es gestartet wird:
* Domains wie `craft-vibeforce.vercel.app`, `vibeforce-craft-os.vercel.app` oder Subdomains mit `craft.*` und `handwerk.*` schalten die gesamte Anwendung verzögerungsfrei auf **Craft OS** um:
  * **Farb- & Markenschema:** Warmes Meister-Bernstein (`#f59e0b`) mit goldenem Hammer-Signet.
  * **Navigation & Menüs:** Handwerksspezifische Terminologie (Baustellen, Bauherren, Mängel, Monteur-Stempeluhr).
  * **Cookie-Isolation:** Separate Authentifizierungs-Cookies (`pb_auth_craft`) verhindern Sitzungskollisionen mit dem Agenturmodul.

---

## 2. Erste Schritte & Meister-Login

### 2.1 Express-Zugang (1-Klick Demo)
Für Vorführungen, Prüfungen und Meister-Tests verfügt die Anmeldeseite über einen Express-Zugang:
1. Navigiere zu **[https://craft-vibeforce.vercel.app/login](https://craft-vibeforce.vercel.app/login)**.
2. Klicke auf den prominenten Button:  
   👉 **`[⚡ Als Handwerksmeister & Bauleiter testen]`**
3. Du wirst automatisch mit dem vorkonfigurierten Meister-Account (*Robin Lehnebach, Meister & Bauleiter*) angemeldet und direkt in die Handwerks-Zentrale weitergeleitet.

### 2.2 Reguläre Meister-Anmeldung
* **E-Mail:** `***REMOVED***`
* **Passwort:** `***REDACTED***`

---

## 3. Die Handwerks-Zentrale (`/craft`)

Die Handwerks-Zentrale ist das übergeordnete Cockpit für Meister und Geschäftsführung.

### 3.1 Das KPI-Panel
Ganz oben liefert ein viergeteiltes Kennzahlen-Panel sofortige Klarheit:
1. **Aktive Baustellen:** Anzahl der aktuell laufenden Bauvorhaben inklusive Indikator für aktive GPS-Geofencing-Radien.
2. **Bautagesberichte:** Gesamtzahl der erfassten Berichte mit Zähler für rechtssicher signierte Dokumente.
3. **VOB-Aufmaß Netto:** Das kumulierte Netto-Aufmaßvolumen aller Baustellen in Euro.
4. **E-Rechnungen:** Summe der gestellten ZUGFeRD 2.1.1 E-Rechnungen mit Ausweisung des § 13b UStG Anteils.

### 3.2 Schnellauswertungen & Exporte
* **`[DATEV]` Button:** Erzeugt sofort eine standardkonforme `DATEV_EXTF700_...csv` Datei für das Steuerbüro (Konten SKR03: `8337` für steuerfreie Bauleistungen gem. § 13b UStG, `8400` für 19% Materiallieferungen).
* **`[+ Bericht erfassen]` Button:** Öffnet das Schnell-Erfassungsfenster für spontane Bautagesnotizen direkt aus der Zentrale.
* **`[Baustelle anlegen]` Button:** Erstellt ein neues Bauvorhaben mit Adresse, GPS-Koordinaten, Bauherrenzuordnung und VOB-Präferenzen.

---

## 4. Baustellenverwaltung & Bauvorhaben (`/projects`)

Unter dem Menüpunkt **Baustellen & Bauvorhaben** in der linken Navigationsleiste werden alle laufenden und abgeschlossenen Projekte gelistet.

### Vorkonfigurierte Muster-Baustellen
Das System wird mit zwei realistischen Referenz-Bauvorhaben ausgeliefert:
1. **BAU-01: Neubau EFH Familie Huber (Dachstuhl & Holzbau)**  
   *Standort:* Riemerling / München Süd  
   *Umfang:* Vollständiger Dachstuhlabstimmung, Aufsparrendämmung, Eindeckung.
2. **BAU-02: Sanierung Gewerbehalle Schmidt (Brandschutz & Trockenbau)**  
   *Standort:* München Nord  
   *Umfang:* F90 Stahlträgerbekleidung, Promat-Abschottung, VOB/B § 6 Behinderungsanzeige.

Ein Klick auf eine Baustellenkarte öffnet die detaillierte **digitale Baustellen-Akte**.

---

## 5. Die digitale Baustellen-Akte (`/projects/[id]`)

Die Baustellen-Akte fasst alle kaufmännischen, technischen und rechtlichen Daten eines Projekts in 6 spezialisierten Reitern zusammen:

### 5.1 Bautagebuch & VOB/B § 6 Behinderungsmanagement
* **Wetter-Protokollierung:** Automatischer Abgleich mit Wetterdiensten basierend auf den Projekt-Koordinaten (Temperatur, Bewölkung, Niederschlag, Windstärke).
* **Arbeitskräfte & Kolonnen:** Erfassung nach Qualifikationsstufen (Meister, Geselle, Helfer, Auszubildender) inklusive Regiestunden.
* **VOB/B § 6 Behinderungsanzeige:** Protokollierung von bauseitigen Verzögerungen (z. B. fehlende Vorleistungen anderer Gewerke, Stromausfall, witterungsbedingte Sperren) mit Kausalitätsnachweis.
* **Digitale Vor-Ort-Signatur:** Bauherr oder Architekt unterzeichnen direkt auf dem Touchscreen. Das System generiert einen **SHA-256 Hash**, der den Bericht unveränderbar versiegelt.

### 5.2 VOB-Aufmaßblatt nach DIN 18299 mit Formel-Parser
* **Integrierter Rechenkern:** Der Vorarbeiter gibt mathematische Formeln direkt in das Feld ein, z. B.:  
  `12.40 * 6.50 - 1.20 * 0.80`  
  Das System berechnet das Zwischenergebnis (`79,64 m²`) in Echtzeit.
* **DIN 18299 § 4 Übermessungsregel:** Aussparungen, Einzelfenster und Türen unter 2,5 m² Einzelfläche werden nach VOB/C voll übermessen. Das System weist den Anwender automatisch darauf hin.
* **Steuer-Splitting:** Jede Zeile kann zwischen Bauleistung (0 % nach § 13b UStG Reverse-Charge) und Materialverkauf (19 % Standard) differenziert werden.

### 5.3 Margen- & Soll/Ist-Nachkalkulation
* **Deckungsbeitrag I (Rohertrag):** Erlöse abzüglich Material- und Fremdleistungskosten.
* **Deckungsbeitrag II (Reingewinn):** Rohertrag abzüglich tatsächlicher Lohnkosten der Monteure.
* **Stunden-Burnup:** Grafischer Soll/Ist-Vergleich der geleisteten Arbeitsstunden gegenüber dem kalkulierten Budget.

### 5.4 GAEB / Leistungsverzeichnis (X83 / X84)
* Import und Export von Leistungsverzeichnissen nach dem deutschen GAEB DA XML-Standard.
* Automatische Zuordnung von Positionen zur Aufmaßberechnung.

### 5.5 GPS-Geofencing & Baustellenradius
* Definition eines geografischen Mittelpunkts (Breiten- und Längengrad) und eines Radius (z. B. 150 Meter).
* Automatische Prüfung bei mobiler Zeiterfassung: Stempelungen außerhalb des Radius werden mit einem optischen Prüfhinweis versehen.

### 5.6 Plan-Pinning & Mängelverortung
* Upload von Bauplänen als PDF oder hochauflösende Bilddatei.
* Punktgenaues Setzen von Mängel-Pins mit Fotoanhang, Fristsetzung gem. VOB/B § 13 und Statusverfolgung.

---

## 6. ZUGFeRD 2.1.1 E-Rechnung & DATEV-Schnittstelle

Ab 2025/2026 gilt in Deutschland die gesetzliche Verpflichtung zur elektronischen Rechnungsstellung im B2B-Bereich. Vibeforce Craft OS erfüllt diese Anforderung nativ ohne kostenpflichtige Zusatzmodule.

### 6.1 ZUGFeRD 2.1.1 / XRechnung XML-Export
* **Normkonformität:** Vollständige Einhaltung des Standards EN 16931 und der Profilspezifikation *ZUGFeRD 2.1.1 Comfort / Extended*.
* **Automatisierte Felder:**
  * Verkäufer- und Käufer-Identifikatoren (USt-IdNr., Steuernummer).
  * Leistungszeitraum und VOB-Zahlungsziel („Zahlbar innerhalb von 14 Tagen nach VOB/B § 16 Abs. 1“).
  * Line-Item-Aufschlüsselung mit UN/CEFACT Einheitencodes (`MTK` für m², `MTQ` für m³, `HUR` für Stunden, `C62` für Stück).
  * Steuerbefreiungsvermerk bei § 13b UStG: `Steuerschuldnerschaft des Leistungsempfängers`.

### 6.2 DATEV EXTF700 Buchungsstapel
Der Export liefert eine direkt in DATEV Rechnungswesen einlesbare CSV-Datei:
* **SKR03 Standard-Kontierung:**
  * Konto `8337`: Erlöse aus im Inland steuerpflichtigen EU-/Bauleistungen (§ 13b UStG), BU-Schlüssel `68`.
  * Konto `8400`: Erlöse 19 % USt bei Materiallieferungen.
  * Gegenkonto `10000`: Debitoren-Sammelkonto.
* **Kostenstellen-Zuordnung:** Automatische Übernahme der Baustellen-Kennung (z. B. `BAU-01`) als DATEV-KOST1.

---

## 7. Großhandels-Anbindung über IDS-Connect 2.5

Craft OS integriert den Branchenstandard **IDS-Connect 2.5**:
1. **Warenkorb-Aufruf:** Der Einkäufer wählt die Baustelle und öffnet den Shop des angebundenen Großhändlers (z. B. GC-Gruppe, Gienger, Cordes & Graefe, Richter+Frenzel).
2. **Punchout-Warenkorb:** Die Artikel werden im Webshop zusammengestellt und per Klick auf *„In Handwerkersoftware übernehmen“* übertragen.
3. **Automatischer Import:** Craft OS übernimmt Artikelnummern, EANs, Beschreibungen, Staffelpreise und Liefertermine direkt in die Materialliste des Projekts.

---

## 8. Monteur-Stempeluhr, Mobile Nutzung & Offline-Modus

### 8.1 Progressive Web App (PWA)
Craft OS muss nicht über App-Stores installiert werden:
* Rufe `https://craft-vibeforce.vercel.app` im Safari (iOS) oder Chrome (Android) auf.
* Wähle *„Zum Home-Bildschirm hinzufügen“*.
* Die Anwendung startet im rahmenlosen Vollbildmodus wie eine native App.

### 8.2 Offline-First Architektur (IndexedDB)
* Wenn Monteure im Keller, Tiefgaragen oder ländlichen Funklöchern arbeiten, puffert das System alle Stempelzeiten und Bautagesberichte lokal in der Browser-Datenbank (`IndexedDB`).
* Sobald wieder eine Internetverbindung besteht, synchronisiert ein Hintergrund-Service die Daten geräuschlos mit dem Server.

---

## 9. Administration, Rollen & Berechtigungen

| Rolle | Rechte im System |
| :--- | :--- |
| **Admin / Geschäftsführer** | Voller Zugriff auf alle Baustellen, Finanzen, DATEV-Exporte, Deckungsbeiträge und Benutzereinstellungen. |
| **Meister / Bauleiter** | Verwaltung von Baustellen, Freigabe von Bautagesberichten, Aufmaßerfassung, Nachtragsverwaltung. |
| **Vorarbeiter / Polier** | Erfassung von Bautagesberichten, Witterung, Stunden der Kolonne und Mängeldokumentation. |
| **Monteur** | Reine Zeiterfassung (Stempeluhr) und Ansicht zugewiesener Aufgaben. |

---

## 10. Häufige Fragen (FAQ) & Troubleshooting

**F: Wo liegen die Daten und ist das System DSGVO-konform?**  
*A:* Das System läuft auf dedizierten deutschen Hetzner-Servern (CPX32) mit SQLite im WAL-Modus. Alle Datenverbindungen sind mit TLS 1.3 verschlüsselt.

**F: Können Bautagesberichte nachträglich manipuliert werden?**  
*A:* Nein. Jeder signierte Bautagesbericht erhält einen kryptografischen SHA-256 Hash aus Datum, Witterung, Text und digitaler Unterschrift. Jede nachträgliche Änderung wird sofort als ungültig markiert.

**F: Welche Browser werden unterstützt?**  
*A:* Alle modernen Webbrowser: Google Chrome, Apple Safari, Mozilla Firefox und Microsoft Edge (Desktop, Tablet und Smartphone).

---
*Dokumenten-ID: VIBE-CRAFT-MANUAL-2026-v2.5 • Vibeforce One Systems*
