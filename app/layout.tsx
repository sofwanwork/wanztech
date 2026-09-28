import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/components/auth-provider';

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
    default: 'KlikForm - Next-Gen Online Forms & Automated E-Certificates',
    template: '%s | KlikForm',
  },
  description:
    'Free online form builder and automated digital certificate generator. Real-time Google Sheets sync, QR codes, Link-in-Bio, and WhatsApp integration.',
  keywords: [
    'online forms',
    'digital certificates',
    'e-certificates',
    'e-certificate generator',
    'google sheets form',
    'attendance form',
    'event registration system',
    'online form builder',
    'klikform',
    'free form builder',
    'whatsapp form',
    'e-cert system',
    'free registration system',
    'bulk certificates',
    'link in bio',
    'QR attendance system',
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
    locale: 'en_US',
    alternateLocale: 'ms_MY',
    url: 'https://klikform.com',
    siteName: 'KlikForm',
    title: 'KlikForm - Next-Gen Online Forms & Automated E-Certificates',
    description:
      'Build smart forms and automate digital certificates with real-time Google Sheets sync and WhatsApp integration. Start free today.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'KlikForm - Online Form & Digital Certificate System',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KlikForm - Next-Gen Online Forms & Automated E-Certificates',
    description:
      'Build smart forms and automate digital certificates with real-time Google Sheets sync. Start free today.',
    images: ['/og-image.png'],
    creator: '@klikform',
  },
  // icons removed to allow app/icon.tsx to take precedence
  // icons: {
  //   icon: [
  //     { url: '/favicon.ico' },
  //     { url: '/logo.png', sizes: '192x192', type: 'image/png' },
  //     { url: '/logo.png', sizes: '512x512', type: 'image/png' },
  //   ],
  //   apple: [{ url: '/logo.png' }],
  // },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: 'https://klikform.com',
  },
  category: 'productivity',
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
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
        'Free Online Form Builder',
        'Google Sheets Integration',
        'Automated Digital Certificates',
        'Dynamic QR Code Generator',
        'Canva-Style E-Certificate Studio',
        'Bulk CSV to ZIP Generator',
        'KlikBio Link-in-Bio',
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
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
