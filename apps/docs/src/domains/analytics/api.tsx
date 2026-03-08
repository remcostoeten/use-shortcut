import type { ApiMethod, ApiProp } from '@/config/types';

export const analyticsApi: ApiMethod[] = [
  {
    name: 'Analytics',
    signature: '<Analytics />',
    description: 'React component that tracks a page view on mount',
  },
  {
    name: 'track',
    signature: 'track(type, meta?, options?)',
    description: 'Low level tracking call',
  },
  {
    name: 'trackPageView',
    signature: 'trackPageView(meta?, options?)',
    description: 'Track a page view event',
  },
  {
    name: 'trackEvent',
    signature: 'trackEvent(name, meta?, options?)',
    description: 'Track a custom event',
  },
  {
    name: 'trackClick',
    signature: 'trackClick(element, meta?, options?)',
    description: 'Track a click event',
  },
  {
    name: 'trackError',
    signature: 'trackError(error, meta?, options?)',
    description: 'Track an error event',
  },
  {
    name: 'getVisitorId',
    signature: 'getVisitorId(): string',
    description: 'Get the persistent visitor ID',
  },
  {
    name: 'resetVisitorId',
    signature: 'resetVisitorId(): void',
    description: 'Reset the visitor ID (creates new visitor)',
  },
  {
    name: 'getSessionId',
    signature: 'getSessionId(): string',
    description: 'Get the session ID with 30 min timeout',
  },
  {
    name: 'resetSessionId',
    signature: 'resetSessionId(): void',
    description: 'Reset the session ID (creates new session)',
  },
  {
    name: 'extendSession',
    signature: 'extendSession(): void',
    description: 'Extend the current session timeout',
  },
  {
    name: 'optOut',
    signature: 'optOut(): void',
    description: 'Opt out of analytics tracking',
  },
  {
    name: 'optIn',
    signature: 'optIn(): void',
    description: 'Opt in to analytics tracking',
  },
  {
    name: 'isOptedOut',
    signature: 'isOptedOut(): boolean',
    description: 'Check if user is opted out',
  },
  {
    name: 'checkDoNotTrack',
    signature: 'checkDoNotTrack(): boolean',
    description: 'Check if Do Not Track is enabled',
  },
];

export const analyticsApiProps: ApiProp[] = [
  {
    name: 'projectId',
    type: 'string',
    description: 'defaults to window.location.hostname',
  },
  {
    name: 'ingestUrl',
    type: 'string',
    description: 'defaults to process.env.NEXT_PUBLIC_REMCO_ANALYTICS_URL or http://localhost:3001',
  },
  {
    name: 'disabled',
    type: 'boolean',
    description: 'disable tracking when true',
  },
  {
    name: 'debug',
    type: 'boolean',
    description: 'enable debug logging',
  },
];
