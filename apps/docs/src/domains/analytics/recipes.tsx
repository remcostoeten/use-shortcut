import type { ComponentRecipe } from '@/config/types';

export const analyticsRecipes: ComponentRecipe[] = [
  {
    id: 'next-js-analytics-provider',
    title: 'next.js analytics provider',
    summary: 'complete analytics setup for next.js with route tracking',
    description: 'a reusable analytics provider that handles route changes and provides context to child components',
    code: `'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { trackPageView, trackEvent } from '@remcostoeten/analytics'

interface AnalyticsContextValue {
  trackEvent: (name: string, meta?: Record<string, any>) => void
  isTracking: boolean
}

const AnalyticsContext = createContext<AnalyticsContextValue>({
  trackEvent: () => {},
  isTracking: false,
})

export function useAnalytics() {
  return useContext(AnalyticsContext)
}

interface AnalyticsProviderProps {
  children: React.ReactNode
  projectId?: string
  ingestUrl?: string
  debug?: boolean
}

export function AnalyticsProvider({ 
  children, 
  projectId, 
  ingestUrl, 
  debug 
}: AnalyticsProviderProps) {
  const [isTracking, setIsTracking] = useState(false)

  useEffect(() => {
    // track initial page view
    trackPageView(undefined, { projectId, ingestUrl, debug })
    setIsTracking(true)

    // track route changes
    const handleRouteChange = () => {
      trackPageView(undefined, { projectId, ingestUrl, debug })
    }

    // listen for popstate events (browser back/forward)
    window.addEventListener('popstate', handleRouteChange)

    // listen for pushstate/replacestate (spa navigation)
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = function(...args) {
      originalPushState.apply(history, args)
      setTimeout(handleRouteChange, 0)
    }

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args)
      setTimeout(handleRouteChange, 0)
    }

    return () => {
      window.removeEventListener('popstate', handleRouteChange)
      history.pushState = originalPushState
      history.replaceState = originalReplaceState
    }
  }, [projectId, ingestUrl, debug])

  const trackEventWithContext = (name: string, meta?: Record<string, any>) => {
    if (isTracking) {
      trackEvent(name, { ...meta, provider: 'AnalyticsProvider' })
    }
  }

  return (
    <AnalyticsContext.Provider value={{ 
      trackEvent: trackEventWithContext, 
      isTracking 
    }}>
      {children}
    </AnalyticsContext.Provider>
  )
}

// usage in app/layout.tsx:
// import { AnalyticsProvider } from './analytics-provider'
//
// export default function RootLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <html>
//       <body>
//         <AnalyticsProvider projectId="my-app">
//           {children}
//         </AnalyticsProvider>
//       </body>
//     </html>
//   )
// }`,
    language: 'tsx',
  },
  {
    id: 'analytics-with-error-boundary',
    title: 'analytics with error boundary',
    summary: 'error boundary that automatically tracks errors',
    description: 'react error boundary that captures and tracks errors with detailed context',
    code: `'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { trackError } from '@remcostoeten/analytics'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class AnalyticsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // track error with detailed context
    trackError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: 'AnalyticsErrorBoundary',
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: Date.now(),
    })

    // call custom error handler if provided
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ padding: '20px', border: '1px solid #ff6b6b', borderRadius: '4px' }}>
          <h2>something went wrong</h2>
          <p>an error occurred and has been reported to our analytics service.</p>
          <button onClick={() => window.location.reload()}>
            reload page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// usage:
// import { AnalyticsErrorBoundary } from './analytics-error-boundary'
//
// export default function App() {
//   return (
//     <AnalyticsErrorBoundary
//       onError={(error, errorInfo) => {
//         console.error('caught error:', error, errorInfo)
//       }}
//     >
//       <YourApp />
//     </AnalyticsErrorBoundary>
//   )
// }`,
    language: 'tsx',
  },
  {
    id: 'performance-analytics',
    title: 'performance analytics',
    summary: 'track web vitals and performance metrics',
    description: 'component that tracks core web vitals and custom performance metrics',
    code: `'use client'

import { useEffect } from 'react'
import { trackEvent } from '@remcostoeten/analytics'

interface PerformanceMetrics {
  fcp?: number
  lcp?: number
  fid?: number
  cls?: number
  ttfb?: number
}

export function PerformanceAnalytics() {
  useEffect(() => {
    // track core web vitals
    const trackWebVitals = () => {
      // first contentful paint
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            trackEvent('performance_fcp', { 
              value: entry.startTime,
              unit: 'ms' 
            })
          }
          
          if (entry.name === 'largest-contentful-paint') {
            trackEvent('performance_lcp', { 
              value: entry.startTime,
              unit: 'ms' 
            })
          }
        }
      })

      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] })

      // first input delay
      if ('PerformanceEventTiming' in window) {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            trackEvent('performance_fid', { 
              value: entry.processingStart - entry.startTime,
              unit: 'ms' 
            })
          }
        })
        
        fidObserver.observe({ entryTypes: ['first-input'] })
      }

      // cumulative layout shift
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        }
        
        if (clsValue > 0) {
          trackEvent('performance_cls', { 
            value: clsValue,
            unit: 'score' 
          })
        }
      })
      
      clsObserver.observe({ entryTypes: ['layout-shift'] })
    }

    // track navigation timing
    const trackNavigationTiming = () => {
      if ('performance' in window && 'getEntriesByType' in performance) {
        const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
        
        if (navEntries.length > 0) {
          const nav = navEntries[0]
          
          trackEvent('performance_navigation', {
            dns: nav.domainLookupEnd - nav.domainLookupStart,
            tcp: nav.connectEnd - nav.connectStart,
            ttfb: nav.responseStart - nav.requestStart,
            download: nav.responseEnd - nav.responseStart,
            domInteractive: nav.domInteractive - nav.navigationStart,
            loadComplete: nav.loadEventEnd - nav.navigationStart,
            unit: 'ms'
          })
        }
      }
    }

    // track custom metrics
    const trackCustomMetrics = () => {
      // track time to interactive (approximation)
      setTimeout(() => {
        if ('performance' in window && 'now' in performance) {
          const tti = performance.now()
          trackEvent('performance_tti', {
            value: tti,
            unit: 'ms'
          })
        }
      }, 5000)
    }

    // start tracking
    if ('PerformanceObserver' in window) {
      trackWebVitals()
      trackNavigationTiming()
      trackCustomMetrics()
    }
  }, [])

  return null
}

// usage:
// import { PerformanceAnalytics } from './performance-analytics'
//
// export default function App() {
//   return (
//     <>
//       <PerformanceAnalytics />
//       {/* your app content */}
//     </>
//   )
// }`,
    language: 'tsx',
  },
];
