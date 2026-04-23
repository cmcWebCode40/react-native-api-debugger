import type { NetworkLog } from '../types';

export interface HARLog {
  version: string;
  creator: {
    name: string;
    version: string;
  };
  entries: HAREntry[];
}

export interface HAREntry {
  startedDateTime: string;
  time: number;
  request: {
    method: string;
    url: string;
    httpVersion: string;
    headers: { name: string; value: string }[];
    queryString: { name: string; value: string }[];
    postData?: {
      mimeType: string;
      text: string;
    };
    headersSize: number;
    bodySize: number;
  };
  response: {
    status: number;
    statusText: string;
    httpVersion: string;
    headers: { name: string; value: string }[];
    content: {
      size: number;
      mimeType: string;
      text: string;
    };
    headersSize: number;
    bodySize: number;
  };
  cache: Record<string, never>;
  timings: {
    send: number;
    wait: number;
    receive: number;
  };
}

const parseQueryString = (url: string): { name: string; value: string }[] => {
  try {
    const urlObj = new URL(url);
    const params: { name: string; value: string }[] = [];
    urlObj.searchParams.forEach((value, name) => {
      params.push({ name, value });
    });
    return params;
  } catch {
    return [];
  }
};

const headersToArray = (
  headers: Record<string, string>
): { name: string; value: string }[] => {
  return Object.entries(headers).map(([name, value]) => ({ name, value }));
};

const getContentType = (headers: Record<string, string>): string => {
  const contentType = Object.entries(headers).find(
    ([key]) => key.toLowerCase() === 'content-type'
  );
  return contentType ? contentType[1] : 'application/octet-stream';
};

export const networkLogToHAREntry = (log: NetworkLog): HAREntry => {
  const duration = log.response?.duration || log.duration || 0;
  const requestHeaders = headersToArray(log.headers || {});
  const responseHeaders = headersToArray(log.response?.headers || {});

  return {
    startedDateTime: log.timestamp,
    time: duration,
    request: {
      method: log.method,
      url: log.url,
      httpVersion: 'HTTP/1.1',
      headers: requestHeaders,
      queryString: parseQueryString(log.url),
      ...(log.body && {
        postData: {
          mimeType: getContentType(log.headers || {}),
          text: log.body,
        },
      }),
      headersSize: JSON.stringify(requestHeaders).length,
      bodySize: log.body ? log.body.length : 0,
    },
    response: {
      status: log.response?.status || 0,
      statusText: log.response?.statusText || '',
      httpVersion: 'HTTP/1.1',
      headers: responseHeaders,
      content: {
        size: log.response?.body?.length || 0,
        mimeType: getContentType(log.response?.headers || {}),
        text: log.response?.body || '',
      },
      headersSize: JSON.stringify(responseHeaders).length,
      bodySize: log.response?.body?.length || 0,
    },
    cache: {},
    timings: {
      send: 0,
      wait: duration,
      receive: 0,
    },
  };
};

export const exportToHAR = (logs: NetworkLog[]): string => {
  const har: { log: HARLog } = {
    log: {
      version: '1.2',
      creator: {
        name: 'react-native-api-debugger',
        version: '1.0.0',
      },
      entries: logs.map(networkLogToHAREntry),
    },
  };

  return JSON.stringify(har, null, 2);
};

export interface PostmanCollection {
  info: {
    name: string;
    schema: string;
    _postman_id?: string;
  };
  item: PostmanItem[];
}

export interface PostmanItem {
  name: string;
  request: {
    method: string;
    header: { key: string; value: string }[];
    url: {
      raw: string;
      protocol?: string;
      host?: string[];
      path?: string[];
      query?: { key: string; value: string }[];
    };
    body?: {
      mode: string;
      raw: string;
      options?: {
        raw: {
          language: string;
        };
      };
    };
  };
  response: never[];
}

const parseUrlForPostman = (
  url: string
): {
  raw: string;
  protocol?: string;
  host?: string[];
  path?: string[];
  query?: { key: string; value: string }[];
} => {
  try {
    const urlObj = new URL(url);
    const query: { key: string; value: string }[] = [];
    urlObj.searchParams.forEach((value, key) => {
      query.push({ key, value });
    });

    return {
      raw: url,
      protocol: urlObj.protocol.replace(':', ''),
      host: urlObj.hostname.split('.'),
      path: urlObj.pathname.split('/').filter(Boolean),
      ...(query.length > 0 && { query }),
    };
  } catch {
    return { raw: url };
  }
};

export const networkLogToPostmanItem = (log: NetworkLog): PostmanItem => {
  const headers = Object.entries(log.headers || {}).map(([key, value]) => ({
    key,
    value,
  }));

  const item: PostmanItem = {
    name: `${log.method} ${new URL(log.url).pathname}`,
    request: {
      method: log.method,
      header: headers,
      url: parseUrlForPostman(log.url),
    },
    response: [],
  };

  if (log.body) {
    const contentType = getContentType(log.headers || {});
    const isJson = contentType.includes('application/json');

    item.request.body = {
      mode: 'raw',
      raw: log.body,
      options: {
        raw: {
          language: isJson ? 'json' : 'text',
        },
      },
    };
  }

  return item;
};

export const exportToPostman = (
  logs: NetworkLog[],
  collectionName: string = 'API Debugger Export'
): string => {
  const collection: PostmanCollection = {
    info: {
      name: collectionName,
      schema:
        'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: logs.map(networkLogToPostmanItem),
  };

  return JSON.stringify(collection, null, 2);
};

export const exportSingleRequestAsJSON = (log: NetworkLog): string => {
  return JSON.stringify(
    {
      method: log.method,
      url: log.url,
      headers: log.headers,
      body: log.body,
      timestamp: log.timestamp,
      response: log.response
        ? {
            status: log.response.status,
            statusText: log.response.statusText,
            headers: log.response.headers,
            body: log.response.body,
            duration: log.response.duration,
          }
        : null,
      error: log.error,
    },
    null,
    2
  );
};

export type ExportFormat = 'har' | 'postman' | 'json';

export const exportLogs = (
  logs: NetworkLog[],
  format: ExportFormat,
  options?: { collectionName?: string }
): string => {
  switch (format) {
    case 'har':
      return exportToHAR(logs);
    case 'postman':
      return exportToPostman(logs, options?.collectionName);
    case 'json':
      return JSON.stringify(logs, null, 2);
    default:
      return JSON.stringify(logs, null, 2);
  }
};

export const getExportFileName = (format: ExportFormat): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  switch (format) {
    case 'har':
      return `network-logs-${timestamp}.har`;
    case 'postman':
      return `postman-collection-${timestamp}.json`;
    case 'json':
      return `network-logs-${timestamp}.json`;
    default:
      return `network-logs-${timestamp}.json`;
  }
};
