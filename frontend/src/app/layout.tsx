import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

export const dynamic = 'force-dynamic';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Vibeforce Craft OS | Handwerk & Bau',
  description: 'Mobile Baustellendokumentation, VOB-Aufmaße, Mängelverwaltung & Monteur-Zeiterfassung.',
  metadataBase: new URL('https://vibeforce-craft-os-five.vercel.app'),
  openGraph: {
    title: 'Vibeforce Craft OS | Handwerk & Bau',
    description: 'Mobile Baustellendokumentation, VOB-Aufmaße, Mängelverwaltung & Monteur-Zeiterfassung.',
    url: 'https://vibeforce-craft-os-five.vercel.app',
    siteName: 'Vibeforce Craft OS',
    images: [
      {
        url: '/icon-kos.png',
        width: 800,
        height: 600,
      },
    ],
    locale: 'de_DE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vibeforce Craft OS | Handwerk & Bau',
    description: 'Mobile Baustellendokumentation, VOB-Aufmaße, Mängelverwaltung & Monteur-Zeiterfassung.',
    images: ['/icon-kos.png'],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        {/* Blocking script to prevent dark/light mode flash on load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('vibeforce-theme');
                  if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground selection:bg-primary/30 selection:text-blue-200 transition-colors duration-300`}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
