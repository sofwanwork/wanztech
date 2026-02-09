import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://klikform.com'),
  title: {
    default: 'KlikForm - Borang Online & Sijil Digital Automatik #1 Malaysia',
    template: '%s | KlikForm',
  },
  description:
    'Sistem borang online percuma & generator sijil digital automatik. Cipta borang kehadiran, pendaftaran kursus, dan kuiz. Integrasi Google Sheets & WhatsApp.',
  keywords: [
    'borang online',
    'sijil digital',
    'e-sijil',
    'e-certificate generator',
    'google sheets form',
    'borang kehadiran',
    'sistem pendaftaran event',
    'online form malaysia',
    'klikform',
    'form builder percuma',
    'whatsapp form',
    'sistem e-cert',
  ],
  authors: [{ name: 'KlikForm Team', url: 'https://klikform.com' }],
  creator: 'KlikForm',
  publisher: 'KlikForm',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ms_MY',
    alternateLocale: 'en_US',
    url: 'https://klikform.com',
    siteName: 'KlikForm',
    title: 'KlikForm - Borang Online & Sijil Digital Automatik',
    description:
      'Cipta borang pendaftaran dan jana sijil digital secara automatik. Integrasi mudah dengan Google Sheets dan WhatsApp. Mula percuma sekarang.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'KlikForm - Sistem Borang Online & Sijil Digital',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KlikForm - Borang Online & Sijil Digital Automatik',
    description:
      'Cipta borang pendaftaran dan jana sijil digital secara automatik. Percuma untuk pengguna Malaysia.',
    images: ['/og-image.png'],
    creator: '@klikform',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/logo.png', sizes: '192x192', type: 'image/png' },
      { url: '/logo.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/logo.png' }],
  },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: 'https://klikform.com',
  },
  category: 'productivity',
  verification: {
    google: 'YOUR_GOOGLE_VERIFICATION_CODE', // User to update this
  },
};

// JSON-LD Structured Data
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': 'https://klikform.com/#webapp',
      name: 'KlikForm',
      description:
        'Platform borang online percuma untuk cipta borang pendaftaran, kutip data ke Google Sheets, dan jana sijil digital automatik.',
      url: 'https://klikform.com',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'MYR',
      },
      featureList: [
        'Borang Online Percuma',
        'Integrasi Google Sheets',
        'Sijil Digital Automatik',
        'QR Code Generator',
        'E-Certificate Builder',
      ],
    },
    {
      '@type': 'Organization',
      '@id': 'https://klikform.com/#organization',
      name: 'KlikForm',
      url: 'https://klikform.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://klikform.com/logo.png',
      },
      sameAs: [],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://klikform.com/#website',
      url: 'https://klikform.com',
      name: 'KlikForm',
      publisher: {
        '@id': 'https://klikform.com/#organization',
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://klikform.com/search?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ms" data-scroll-behavior="smooth">
      <head>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Google Fonts for E-Cert Builder */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Roboto:wght@300;400;700&family=Open+Sans:wght@300;400;600;700&family=Lato:wght@300;400;700&family=Montserrat:wght@300;400;600;700&family=Poppins:wght@300;400;600;700&family=Merriweather:ital,wght@0,300;0,700;1,300&family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Cinzel:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
