import type { NetworkLog, NetworkResponse } from '../types';

export interface ReplayResult {
  success: boolean;
  response?: NetworkResponse;
  error?: string;
  originalLog: NetworkLog;
  replayedAt: string;
}

export interface ReplayOptions {
  modifyHeaders?: Record<string, string>;
  modifyBody?: string;
  timeout?: number;
}

export const replayRequest = async (
  log: NetworkLog,
  options: ReplayOptions = {}
): Promise<ReplayResult> => {
  const startTime = Date.now();
  const replayedAt = new Date().toISOString();

  const headers: Record<string, string> = {
    ...log.headers,
    ...options.modifyHeaders,
  };

  const fetchOptions: RequestInit = {
    method: log.method,
    headers,
  };

  if (log.body || options.modifyBody) {
    fetchOptions.body = options.modifyBody || log.body || undefined;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      options.timeout || 30000
    );

    fetchOptions.signal = controller.signal;

    const response = await fetch(log.url, fetchOptions);
    clearTimeout(timeoutId);

    let responseBody = '';
    try {
      responseBody = await response.text();
    } catch {
      responseBody = 'Unable to read response body';
    }

    const duration = Date.now() - startTime;

    const networkResponse: NetworkResponse = {
      status: response.status,
      statusText: response.statusText,
      headers: headersToObject(response.headers),
      body: responseBody,
      duration,
    };

    return {
      success: true,
      response: networkResponse,
      originalLog: log,
      replayedAt,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      error: errorMessage,
      originalLog: log,
      replayedAt,
    };
  }
};

const headersToObject = (headers: Headers): Record<string, string> => {
  const obj: Record<string, string> = {};
  headers.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
};

export const canReplayRequest = (log: NetworkLog): boolean => {
  const replayableMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'];
  return replayableMethods.includes(log.method.toUpperCase());
};

export const getReplayWarnings = (log: NetworkLog): string[] => {
  const warnings: string[] = [];

  if (log.method === 'POST' || log.method === 'PUT' || log.method === 'PATCH') {
    warnings.push('This request may modify data on the server');
  }

  if (log.method === 'DELETE') {
    warnings.push('This request may delete data on the server');
  }

  const hasAuthHeader = Object.keys(log.headers || {}).some((key) =>
    ['authorization', 'x-api-key', 'cookie'].includes(key.toLowerCase())
  );

  if (hasAuthHeader) {
    warnings.push('Request contains authentication headers');
  }

  return warnings;
};

export const compareResponses = (
  original: NetworkResponse | undefined,
  replayed: NetworkResponse | undefined
): {
  statusChanged: boolean;
  bodyChanged: boolean;
  durationDiff: number;
  summary: string;
} => {
  if (!original || !replayed) {
    return {
      statusChanged: false,
      bodyChanged: false,
      durationDiff: 0,
      summary: 'Unable to compare responses',
    };
  }

  const statusChanged = original.status !== replayed.status;
  const bodyChanged = original.body !== replayed.body;
  const durationDiff = replayed.duration - original.duration;

  const summaryParts: string[] = [];

  if (statusChanged) {
    summaryParts.push(`Status: ${original.status} → ${replayed.status}`);
  }

  if (bodyChanged) {
    summaryParts.push('Response body changed');
  }

  if (Math.abs(durationDiff) > 100) {
    const sign = durationDiff > 0 ? '+' : '';
    summaryParts.push(`Duration: ${sign}${durationDiff}ms`);
  }

  return {
    statusChanged,
    bodyChanged,
    durationDiff,
    summary: summaryParts.length > 0 ? summaryParts.join(', ') : 'No changes',
  };
};
