import type { CodeExample } from '@/config/types';

export const analyticsExamples: CodeExample[] = [
  {
    title: 'basic-setup',
    description: 'configure and start tracking in your react app',
    code: `import { Analytics } from '@remcostoeten/analytics'

export default function App() {
  return (
    <>
      <Analytics />
      {/* your app content */}
    </>
  )
}`,
  },
  {
    title: 'next-js-app-router',
    description: 'track route changes in next.js app router',
    code: `'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackPageView } from '@remcostoeten/analytics'

type props = {
  projectId?: string
  ingestUrl?: string
  debug?: boolean
}

export function PageViews(p: props) {
  const path = usePathname()
  const search = useSearchParams()

  useEffect(() => {
    trackPageView(undefined, { 
      projectId: p.projectId, 
      ingestUrl: p.ingestUrl, 
      debug: p.debug 
    })
  }, [path, search, p.projectId, p.ingestUrl, p.debug])

  return null
}`,
  },
  {
    title: 'next-js-pages-router',
    description: 'track route changes in next.js pages router',
    code: `import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { trackPageView } from '@remcostoeten/analytics'

export default function App(p: AppProps) {
  const r = useRouter()

  useEffect(() => {
    function onRoute() {
      trackPageView()
    }

    r.events.on('routeChangeComplete', onRoute)
    onRoute()

    return () => {
      r.events.off('routeChangeComplete', onRoute)
    }
  }, [r.events])

  return <p.Component {...p.pageProps} />
}`,
  },
  {
    title: 'custom-events',
    description: 'track user interactions and custom events',
    code: `import { trackEvent, trackClick, trackError } from '@remcostoeten/analytics'

// track custom events
trackEvent('signup', { 
  plan: 'pro', 
  source: 'landing_page' 
})

// track clicks
trackClick('cta_button', { 
  placement: 'hero',
  variant: 'primary'
})

// track errors
try {
  // some operation that might fail
  riskyOperation()
} catch (error) {
  trackError(error as Error, { 
    component: 'checkout',
    step: 'payment'
  })
}`,
  },
  {
    title: 'privacy-controls',
    description: 'respect user privacy and opt-out preferences',
    code: `import { optOut, optIn, isOptedOut, checkDoNotTrack } from '@remcostoeten/analytics'

// check if user is opted out
if (isOptedOut()) {
  console.log('user has opted out of analytics')
}

// respect do not track
if (checkDoNotTrack()) {
  console.log('do not track is enabled')
}

// opt out user
optOut()

// opt in user
optIn()`,
  },
  {
    title: 'identity-management',
    description: 'work with visitor and session ids',
    code: `import { 
  getVisitorId, 
  resetVisitorId, 
  getSessionId, 
  resetSessionId,
  extendSession 
} from '@remcostoeten/analytics'

// get current ids
const visitorId = getVisitorId()
const sessionId = getSessionId()

// reset visitor id (creates new visitor)
resetVisitorId()

// reset session id (creates new session)
resetSessionId()

// extend current session (30 min timeout)
extendSession()`,
  },
];
