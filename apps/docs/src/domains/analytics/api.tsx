import type { ApiMethod, ApiProp } from '@/config/types';

export const analyticsApi: ApiMethod[] = [
  {
    name: 'Analytics',
    signature: '<Analytics />',
    description: 'Drop in component - handles everything automatically',
  },
];

export const analyticsApiProps: ApiProp[] = [
  {
    name: 'projectId',
    type: 'string',
    description: 'optional - defaults to hostname',
  },
  {
    name: 'ingestUrl',
    type: 'string',
    description: 'optional - defaults to env var',
  },
];
