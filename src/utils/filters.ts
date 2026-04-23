import type { NetworkLog } from '../types';

export type StatusFilterKey =
  | 'all'
  | 'success'
  | 'redirect'
  | 'clientError'
  | 'serverError'
  | 'error';

export interface FilterState {
  searchTerm: string;
  statusFilter: StatusFilterKey;
  methodFilter: string | null;
  apiOnly: boolean;
}

export const defaultFilterState: FilterState = {
  searchTerm: '',
  statusFilter: 'all',
  methodFilter: null,
  apiOnly: false,
};

export const matchesSearchTerm = (
  log: NetworkLog,
  searchTerm: string
): boolean => {
  if (!searchTerm) return true;
  const lowerSearch = searchTerm.toLowerCase();
  return (
    log.url.toLowerCase().includes(lowerSearch) ||
    log.method.toLowerCase().includes(lowerSearch) ||
    (log.response?.body?.toLowerCase().includes(lowerSearch) ?? false) ||
    (log.body?.toLowerCase().includes(lowerSearch) ?? false)
  );
};

export const matchesStatusFilter = (
  log: NetworkLog,
  statusFilter: StatusFilterKey
): boolean => {
  const status = log.response?.status;
  const hasError = !!log.error;

  switch (statusFilter) {
    case 'all':
      return true;
    case 'success':
      return status !== undefined && status >= 200 && status < 300;
    case 'redirect':
      return status !== undefined && status >= 300 && status < 400;
    case 'clientError':
      return status !== undefined && status >= 400 && status < 500;
    case 'serverError':
      return status !== undefined && status >= 500;
    case 'error':
      return hasError || (status !== undefined && status >= 400);
    default:
      return true;
  }
};

export const matchesMethodFilter = (
  log: NetworkLog,
  methodFilter: string | null
): boolean => {
  if (!methodFilter) return true;
  return log.method.toUpperCase() === methodFilter.toUpperCase();
};

export const matchesApiFilter = (
  log: NetworkLog,
  apiOnly: boolean
): boolean => {
  if (!apiOnly) return true;
  return log.url.toLowerCase().includes('api');
};

export const filterLogs = (
  logs: NetworkLog[],
  filters: FilterState
): NetworkLog[] => {
  return logs.filter((log) => {
    return (
      matchesSearchTerm(log, filters.searchTerm) &&
      matchesStatusFilter(log, filters.statusFilter) &&
      matchesMethodFilter(log, filters.methodFilter) &&
      matchesApiFilter(log, filters.apiOnly)
    );
  });
};

export const shouldIgnoreUrl = (url: string, patterns: string[]): boolean => {
  if (patterns.length === 0) return false;
  return patterns.some((pattern) => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'), 'i');
      return regex.test(url);
    }
    return url.toLowerCase().includes(pattern.toLowerCase());
  });
};

export const shouldIgnoreDomain = (url: string, domains: string[]): boolean => {
  if (domains.length === 0) return false;
  try {
    const urlObj = new URL(url);
    return domains.some(
      (domain) => urlObj.hostname.toLowerCase() === domain.toLowerCase()
    );
  } catch {
    return false;
  }
};

export const getLogStats = (
  logs: NetworkLog[]
): {
  total: number;
  success: number;
  errors: number;
  pending: number;
  avgDuration: number;
} => {
  const stats = {
    total: logs.length,
    success: 0,
    errors: 0,
    pending: 0,
    avgDuration: 0,
  };

  let totalDuration = 0;
  let durationCount = 0;

  logs.forEach((log) => {
    const status = log.response?.status;
    const duration = log.response?.duration || log.duration;

    if (log.error || (status !== undefined && status >= 400)) {
      stats.errors++;
    } else if (status !== undefined && status >= 200 && status < 400) {
      stats.success++;
    } else {
      stats.pending++;
    }

    if (duration) {
      totalDuration += duration;
      durationCount++;
    }
  });

  stats.avgDuration =
    durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;

  return stats;
};
