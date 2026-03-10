import type { PackageConfig } from '@/config/types';
import { analyticsApi } from '@/domains/analytics/api';
import { getPackageDocsUrl } from '@/config/site';

export const analyticsConfig: PackageConfig = {
  slug: 'analytics',
  packageName: '@remcostoeten/analytics',
  installName: '@remcostoeten/analytics',
  heroTitle: '@remcostoeten/analytics',
  tagline: 'privacy-focused',
  description: 'a lightweight analytics sdk for react that tracks pageviews and custom events without cookies, third-party dashboards, or bloated setup.',
  heroSubcopy: 'send clean product signals to your own endpoint, keep the data flow simple, and stay in control of storage, privacy, and reporting.',
  bundleSizeKb: 4.2,
  author: {
    name: 'Remco Stoeten',
    handle: 'remcostoeten',
    url: 'https://github.com/remcostoeten',
  },
  links: {
    npm: 'https://www.npmjs.com/package/@remcostoeten/analytics',
    github: 'https://github.com/remcostoeten/analytics',
    docs: getPackageDocsUrl('analytics'),
  },
  ctas: [
    {
      label: 'view source',
      url: 'https://github.com/remcostoeten/analytics',
      primary: false,
    },
    {
      label: 'npm package',
      url: 'https://www.npmjs.com/package/@remcostoeten/analytics',
      primary: true,
    },
  ],
  navLinks: [
    { label: 'installation', url: '#installation' },
    { label: 'quickstart', url: '#quickstart' },
    { label: 'api-reference', url: '#api-reference' },
  ],
  apiMethodGroups: [
    {
      title: 'core-api',
      methods: analyticsApi,
    },
  ],
  apiProps: [
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
  ],
};
