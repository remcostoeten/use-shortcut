import HomeView from "@/views/home"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    default: "useShortcut",
    template: "%s | useShortcut",
  },
  description:
    "Chainable, type safe keyboard shortcuts for React. Supports modern browsers, complex modifier keys, and conditional execution.",
  keywords: [
    "react",
    "react hooks",
    "keyboard shortcuts",
    "hotkeys",
    "typescript",
    "accessibility",
  ],
  applicationName: "useShortcut",
  authors: [{ name: "Remco Stoeten" }],
  creator: "Remco Stoeten",
  publisher: "useShortcut",
  category: "Technology",

  metadataBase: new URL("https://useshortcut.dev"),

  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },

  openGraph: {
    type: "website",
    url: "https://useshortcut.dev",
    title: "useShortcut",
    description:
      "Type safe, chainable keyboard shortcuts for React applications.",
    siteName: "useShortcut",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "useShortcut React Hook",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "useShortcut",
    description:
      "Chainable, type safe keyboard shortcuts for React.",
    images: ["/og.png"],
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },

  manifest: "/site.webmanifest",
}

export default function Home() {
  return <HomeView />
}
