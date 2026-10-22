import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Impressum — Vibeforce Flow OS / VIBE Craft OS',
  description: 'Anbieterkennzeichnung gemäß § 5 DDG (Digitale-Dienste-Gesetz).',
};

export default function ImpressumPage() {
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
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-foreground mb-2">Impressum</h1>
          <p className="text-muted-foreground text-sm mb-10">Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz)</p>

          <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
            <section>
              <h2 className="text-foreground font-bold text-base mb-2">Diensteanbieter</h2>
              <p>
                Robin Niklas Lehnebach
                <br />
                Tannenweg 47 B
                <br />
                36093 Künzell
                <br />
                Deutschland
              </p>
            </section>

            <section>
              <h2 className="text-foreground font-bold text-base mb-2">Kontakt</h2>
              <p>
                E-Mail:{' '}
                <a href="mailto:lehnebachrobin@gmail.com" className="text-foreground underline underline-offset-2">
                  lehnebachrobin@gmail.com
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-foreground font-bold text-base mb-2">Art des Angebots</h2>
              <p>
                „Vibeforce Flow OS“ und „VIBE Craft OS“ sind private Software-Entwicklungs- und
                Demonstrationsprojekte. Die bereitgestellten Anwendungen dienen ausschließlich Demonstrations-,
                Test- und Evaluierungszwecken. Es werden über diese Anwendungen keine Waren oder Dienstleistungen
                entgeltlich angeboten und es werden hierüber keine Umsätze erzielt.
              </p>
              <p className="mt-2">
                Hinweis: Sobald eine gewerbliche Nutzung aufgenommen wird, werden die dann gesetzlich erforderlichen
                Angaben (z.&nbsp;B. Umsatzsteuer-Identifikationsnummer, Handelsregistereintrag) an dieser Stelle
                ergänzt.
              </p>
            </section>

            <section>
              <h2 className="text-foreground font-bold text-base mb-2">Haftung für Inhalte</h2>
              <p>
                Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den
                allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht
                verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu
                forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung
                der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine
                diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung
                möglich.
              </p>
            </section>

            <section>
              <h2 className="text-foreground font-bold text-base mb-2">Haftung für Links</h2>
              <p>
                Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben.
                Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der
                verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber verantwortlich. Bei Bekanntwerden von
                Rechtsverletzungen werden wir derartige Links umgehend entfernen.
              </p>
            </section>

            <section>
              <h2 className="text-foreground font-bold text-base mb-2">Urheberrecht</h2>
              <p>
                Die durch den Betreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen
                Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
                Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
                Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>Stand: 22.10.2026</span>
            <Link href="/datenschutz" className="hover:text-foreground transition-colors">
              Zur Datenschutzerklärung →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
