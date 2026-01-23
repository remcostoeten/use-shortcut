import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'useShortcut - Chainable Keyboard Shortcuts for React',
  description: 'Chainable keyboard shortcuts for React with perfect TypeScript intellisense. Build complex keyboard interactions with minimal code.',
  keywords: ['keyboard shortcuts', 'React', 'TypeScript', 'hotkeys', 'keyboard events', 'a11y'],
  generator: 'Next.js',
  applicationName: 'useShortcut',
  authors: [
    {
      name: 'Remco Stoeten',
      url: 'https://github.com/remcostoeten',
    },
  ],
  creator: 'Remco Stoeten',
  publisher: 'npm',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://use-shorotcuts.vercel.app'),
  alternates: {
    canonical: 'https://use-shorotcuts.vercel.app',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://use-shorotcuts.vercel.app',
    siteName: 'useShortcut',
    title: 'useShortcut - Chainable Keyboard Shortcuts for React',
    description: 'Chainable keyboard shortcuts for React with perfect TypeScript intellisense. Build complex keyboard interactions with minimal code.',
    images: [
      {
        url: 'https://use-shorotcuts.vercel.app/icon.svg',
        width: 1200,
        height: 630,
        alt: 'useShortcut - Keyboard Shortcuts for React',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'useShortcut - Chainable Keyboard Shortcuts for React',
    description: 'Chainable keyboard shortcuts for React with perfect TypeScript intellisense.',
    creator: '@remcostoeten',
    images: ['https://use-shorotcuts.vercel.app/icon.svg'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      {
        url: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        url: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/icon-light-32x32.png',
        sizes: '32x32',
        type: 'image/png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        sizes: '32x32',
        type: 'image/png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: [
      {
        url: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'useShortcut',
  },
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`font-sans antialiased dark`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
