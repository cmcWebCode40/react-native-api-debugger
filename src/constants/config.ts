import type { NetworkLoggerConfig } from '../types';

export const DEFAULT_CONFIG: NetworkLoggerConfig = {
  maxLogs: 100,
  ignoredUrls: [],
  ignoredDomains: [],
  ignoredMethods: [],
  redactHeaders: ['Authorization', 'X-API-Key', 'Cookie', 'Set-Cookie'],
  enableRedaction: false,
  slowRequestThreshold: 3000,
};

export const FILTER_OPTIONS = {
  statusCodes: [
    { key: 'all', label: 'All', filter: () => true },
    {
      key: 'success',
      label: '2xx',
      filter: (status?: number) =>
        status !== undefined && status >= 200 && status < 300,
    },
    {
      key: 'redirect',
      label: '3xx',
      filter: (status?: number) =>
        status !== undefined && status >= 300 && status < 400,
    },
    {
      key: 'clientError',
      label: '4xx',
      filter: (status?: number) =>
        status !== undefined && status >= 400 && status < 500,
    },
    {
      key: 'serverError',
      label: '5xx',
      filter: (status?: number) => status !== undefined && status >= 500,
    },
    {
      key: 'error',
      label: 'Errors',
      filter: (status?: number, hasError?: boolean) =>
        hasError || (status !== undefined && status >= 400),
    },
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
} as const;

export const UI_CONFIG = {
  floatingButton: {
    size: 58,
    padding: 20,
    borderRadius: 25,
  },
  logItem: {
    maxUrlLines: 4,
    maxDetailsHeight: 400,
  },
  animation: {
    springConfig: {
      damping: 15,
      stiffness: 150,
    },
  },
} as const;
