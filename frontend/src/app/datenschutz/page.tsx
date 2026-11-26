import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung — Vibeforce Flow OS / VIBE Craft OS',
  description: 'Informationen zur Verarbeitung personenbezogener Daten gemäß Art. 13 DSGVO.',
};

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/30 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-[820px] py-10 z-10">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Zurück zur Anmeldung
        </Link>

        <div className="bg-card/40 backdrop-blur-2xl border border-border rounded-[2rem] p-8 sm:p-12 shadow-2xl">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-foreground mb-2">
            Datenschutzerklärung
          </h1>
          <p className="text-muted-foreground text-sm mb-10">
            Informationen nach Art. 13 DSGVO zur Verarbeitung personenbezogener Daten
          </p>

          <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
            <section>
              <h2 className="text-foreground font-bold text-base mb-2">1. Verantwortlicher</h2>
              <p>
                Verantwortlich für die Datenverarbeitung im Sinne von Art. 4 Nr. 7 DSGVO ist:
                <br />
                Robin Niklas Lehnebach
                <br />
                Tannenweg 47 B, 36093 Künzell, Deutschland
                <br />
                E-Mail:{' '}
                <a href="mailto:lehnebachrobin@gmail.com" className="text-foreground underline underline-offset-2">
                  lehnebachrobin@gmail.com
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-foreground font-bold text-base mb-2">2. Überblick &amp; Betriebszweck</h2>
              <p>
                Diese Anwendung („Vibeforce Flow OS“ / „VIBE Craft OS“) wird als gewerbliche Software-as-a-Service-Lösung
                (SaaS) für Projekt-, Zeit- und Handwerksverwaltung sowie ergänzend zu Demonstrations- und Testzwecken
                betrieben. Personenbezogene Daten werden nur verarbeitet, soweit dies zur Vertragserfüllung, zur
                Bereitstellung der Anwendung, zu deren sicherem Betrieb oder zur Erfüllung gesetzlicher Pflichten
                erforderlich ist. Es findet kein Tracking, keine Werbung und keine Weitergabe personenbezogener Daten zu
                Marketingzwecken statt.
              </p>
            </section>

            <section>
              <h2 className="text-foreground font-bold text-base mb-2">3. Welche Daten verarbeitet werden</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <span className="text-foreground">Konto- und Zugangsdaten:</span> Name, E-Mail-Adresse, Rolle im
                  System sowie das Passwort (wird ausschließlich als kryptografischer Hash gespeichert, nie im
                  Klartext).
                </li>
                <li>
                  <span className="text-foreground">Inhaltsdaten:</span> Die in der Anwendung erfassten Daten, z.&nbsp;B.
                  Projekte, Kunden, Aufgaben, Zeiteinträge, Tätigkeitsberichte und Rechnungsangaben — einschließlich
                  der darin enthaltenen personenbezogenen Daten.
                </li>
                <li>
                  <span className="text-foreground">Demo-/Gastzugänge:</span> Für den 1-Klick-Demo-Zugang werden
                  automatisch angelegte Testkonten verwendet. Eintragungen im Demo-Bereich können für andere
                  Demo-Nutzer sichtbar sein — bitte dort keine echten personenbezogenen Daten Dritter erfassen.
                </li>
                <li>
                  <span className="text-foreground">Technische Daten:</span> Beim Aufruf der Anwendung verarbeitet die
                  Hosting-Infrastruktur technisch notwendige Verbindungsdaten (z.&nbsp;B. IP-Adresse, Zeitpunkt,
                  angeforderte Ressource, Browser-Kennung) zur Auslieferung und Betriebssicherheit. Die Anwendung
                  selbst nutzt die IP-Adresse ausschließlich für eine flüchtige Schutzprüfung gegen Missbrauch
                  (Rate-Limiting) im Arbeitsspeicher — ohne dauerhafte Speicherung.
                </li>
                <li>
                  <span className="text-foreground">Cookies und lokale Speicherung:</span> Für die Anmeldung wird ein
                  unbedingt erforderliches Session-Cookie gesetzt („pb_auth_flow“ bzw. „pb_auth_craft“, zusätzlich
                  kompatibel „pb_auth“; SameSite=Lax, Secure). Lokal im Browser werden lediglich
                  Darstellungseinstellungen (z.&nbsp;B. Hell-/Dunkelmodus) gespeichert. Es werden keine Marketing-,
                  Tracking- oder Drittanbieter-Cookies eingesetzt (Rechtsgrundlage: § 25 Abs. 2 Nr. 2 TDDDG).
                </li>
                <li>
                  <span className="text-foreground">Standort- und Geofencing-Daten (GPS):</span> Bei Nutzung der
                  Baustellen-Zeiterfassung (Monteur-Stempeluhr) sowie bei der Beweisfotodokumentation (Mängelmanagement
                  und Bautagesberichte) können — ausschließlich nach ausdrücklicher Gerätefreigabe — GPS-Koordinaten
                  (Breitengrad, Längengrad, Genauigkeit) zum Zeitpunkt des Stempel- bzw. Aufnahmevorgangs verarbeitet
                  werden. Es erfolgt kein dauerhaftes Hintergrund-Tracking und keine Bewegungsprofilerstellung.
                </li>
                <li>
                  <span className="text-foreground">Betriebliche Mitbestimmung (BetrVG § 87 Abs. 1 Nr. 6):</span> Bei
                  Einsatz der digitalen Zeiterfassung und der optionalen Geofencing-Verifikation im Beschäftigtenverhältnis
                  obliegt dem jeweiligen Arbeitgeber (Mandanten) die Einhaltung etwaiger betriebsverfassungsrechtlicher
                  Mitbestimmungspflichten (§ 87 Abs. 1 Nr. 6 BetrVG). Die Anwendung unterstützt eine datensparsame,
                  zweckgebundene Standortprüfung ohne lückenlose Verhaltens- oder Leistungskontrolle.
                </li>
                <li>
                  <span className="text-foreground">Kontaktanfragen:</span> Nutzen Sie das Kontaktformular an die
                  Administration, werden Ihre Angaben (E-Mail, Betreff, Nachricht) ausschließlich zur Bearbeitung der
                  Anfrage per E-Mail weitergeleitet und nicht in der Anwendungsdatenbank gespeichert.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-foreground font-bold text-base mb-2">4. Zwecke und Rechtsgrundlagen</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Bereitstellung und Betrieb der Anwendung (Anmeldung, Darstellung, Kernfunktionen, Baustellen- und
                  Zeiterfassung einschließlich optionaler GPS-Verifikation) — Art. 6 Abs. 1 lit. b DSGVO
                  (Vertragserfüllung), Art. 6 Abs. 1 lit. a DSGVO (Einwilligung bei optionaler Standortfreigabe), § 26
                  BDSG (Beschäftigtendaten) bzw. bei Demo-/Testnutzung Art. 6 Abs. 1 lit. f DSGVO.
                </li>
                <li>
                  IT-Sicherheit, Missbrauchsabwehr und Fehleranalyse — Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
                  Interesse an einem sicheren, störungsfreien Betrieb).
                </li>
                <li>Erfüllung gesetzlicher Pflichten (z.&nbsp;B. Aufbewahrung, Protokollierung) — Art. 6 Abs. 1 lit. c DSGVO.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-foreground font-bold text-base mb-2">5. Hosting und Empfänger</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <span className="text-foreground">Frontend-Hosting:</span> Vercel Inc. (USA). Vercel ist unter dem
                  EU-U.S. Data Privacy Framework (DPF) zertifiziert; die Übermittlung in die USA erfolgt auf Grundlage
                  des EU-U.S. DPF bzw. von Standardvertragsklauseln. Weitere Informationen:{' '}
                  <a
                    href="https://vercel.com/legal/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground underline underline-offset-2"
                  >
                    Datenschutzhinweise von Vercel
                  </a>
                  .
                </li>
                <li>
                  <span className="text-foreground">Backend/Datenbank:</span> Hetzner Online GmbH (Industriestr. 25,
                  91710 Gunzenhausen, Deutschland). Der Serverstandort liegt in Deutschland (EU).
                </li>
                <li>
                  <span className="text-foreground">Weitere Empfänger:</span> Es erfolgt keine Übermittlung
                  personenbezogener Daten an sonstige Dritte, insbesondere nicht zu Werbe- oder Analysezwecken.
                </li>
                <li>
                  Schriftarten und sonstige Ressourcen werden ausschließlich lokal über unser eigenes Hosting
                  ausgeliefert; es werden keine externen Font- oder CDN-Anbieter eingebunden.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-foreground font-bold text-base mb-2">6. Speicherdauer</h2>
              <p>
                Personenbezogene Daten werden nur so lange gespeichert, wie es für die oben genannten Zwecke
                erforderlich ist — insbesondere für die Dauer eines bestehenden Test-, Demo- oder Nutzerzugangs. Daten
                können darüber hinaus jederzeit auf Anfrage gelöscht werden. Technische Protokolldaten der
                Hosting-Anbieter unterliegen deren üblichen Löschfristen.
              </p>
            </section>

            <section>
              <h2 className="text-foreground font-bold text-base mb-2">7. Keine automatisierte Entscheidungsfindung</h2>
              <p>
                Es findet keine automatisierte Entscheidungsfindung einschließlich Profiling im Sinne des Art. 22
                DSGVO statt. Es werden keine Profile über Nutzer zu Werbezwecken gebildet.
              </p>
            </section>

            <section>
              <h2 className="text-foreground font-bold text-base mb-2">8. KI-Transparenz (EU AI Act, Art. 50)</h2>
              <p>
                Die bereitgestellten Anwendungen nutzen derzeit keine KI-Funktionen, die mit Nutzern interagieren oder
                Inhalte für Nutzer erzeugen; es werden keine KI-gestützten Entscheidungen über Personen getroffen.
                KI-Werkzeuge werden ausschließlich intern bei der Softwareentwicklung und Qualitätssicherung
                eingesetzt; personenbezogene Daten der Anwendungsnutzer werden dabei nicht verarbeitet. Sollten
                künftig KI-gestützte Funktionen eingeführt werden, werden deren Ergebnisse gemäß Art. 50 EU AI Act
                gekennzeichnet und diese Erklärung vorab aktualisiert.
              </p>
            </section>

            <section>
              <h2 className="text-foreground font-bold text-base mb-2">9. Ihre Rechte</h2>
              <p>Ihnen stehen nach der DSGVO folgende Rechte zu:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Auskunft über die verarbeiteten Daten (Art. 15 DSGVO)</li>
                <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
                <li>Löschung („Recht auf Vergessenwerden“, Art. 17 DSGVO)</li>
                <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
                <li>Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21 DSGVO)</li>
                <li>Widerruf erteilter Einwilligungen mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO)</li>
              </ul>
              <p className="mt-2">
                Zur Ausübung Ihrer Rechte genügt eine Nachricht an:{' '}
                <a href="mailto:lehnebachrobin@gmail.com" className="text-foreground underline underline-offset-2">
                  lehnebachrobin@gmail.com
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-foreground font-bold text-base mb-2">10. Beschwerderecht bei der Aufsichtsbehörde</h2>
              <p>
                Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren (Art. 77 DSGVO).
                Zuständig ist:
                <br />
                Der Hessische Beauftragte für Datenschutz und Informationsfreiheit
                <br />
                Gustav-Stresemann-Ring 1, 65189 Wiesbaden
                <br />
                <a
                  href="https://datenschutz.hessen.de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline underline-offset-2"
                >
                  datenschutz.hessen.de
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-foreground font-bold text-base mb-2">11. Datensicherheit</h2>
              <p>
                Die Übertragung erfolgt verschlüsselt (TLS/HTTPS). In der Anwendung gelten rollenbasierte
                Zugriffsregeln; Passwörter werden nur als Hash gespeichert. Zugriff auf die Datenbank haben nur
                berechtigte administrative Zugänge.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>Stand: 26.11.2026 — Diese Erklärung wird bei Änderungen der Verarbeitung aktualisiert.</span>
            <Link href="/impressum" className="hover:text-foreground transition-colors">
              Zum Impressum →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
