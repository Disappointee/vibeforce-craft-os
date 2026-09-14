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
  title: 'Vibeforce Flow OS | Premium Agency OS',
  description: 'The definitive, bespoke project management solution for agencies.',
  metadataBase: new URL('https://vibeforce-flow-os.vercel.app'),
  openGraph: {
    title: 'Vibeforce Flow OS | Premium Agency OS',
    description: 'The definitive, bespoke project management solution for agencies.',
    url: 'https://vibeforce-flow-os.vercel.app',
    siteName: 'Vibeforce Flow OS',
    images: [
      {
        url: '/icon-vfos.png',
        width: 800,
        height: 600,
      },
    ],
    locale: 'de_DE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vibeforce Flow OS | Premium Agency OS',
    description: 'The definitive, bespoke project management solution for agencies.',
    images: ['/icon-vfos.png'],
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
