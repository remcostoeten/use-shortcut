import type { CodeExample } from '@/config/types';

export const analyticsExamples: CodeExample[] = [
  {
    title: 'next.js setup',
    description: 'add analytics to your root layout in 30 seconds',
    code: `import { Analytics } from '@remcostoeten/analytics'

// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}

# .env.local
NEXT_PUBLIC_ANALYTICS_URL=https://ingestion.remcostoeten.nl`,
    language: 'tsx',
  },
  {
    title: 'environment variables',
    description: 'configure your analytics endpoint',
    code: `# Vite (.env)
VITE_ANALYTICS_URL=https://ingestion.remcostoeten.nl

# Next.js (.env.local)
NEXT_PUBLIC_ANALYTICS_URL=https://ingestion.remcostoeten.nl

# optional: custom project identifier
VITE_ANALYTICS_PROJECT_ID=my-app`,
    language: 'bash',
  },
];
