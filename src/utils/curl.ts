import type { NetworkLog } from '../types';

export const generateCurl = (log: NetworkLog): string => {
  let curl = `curl -X ${log.method}`;

  if (log.headers && typeof log.headers === 'object') {
    Object.entries(log.headers).forEach(([key, value]: [string, string]) => {
      const escapedValue = value.replace(/"/g, '\\"');
      curl += ` \\\n  -H "${key}: ${escapedValue}"`;
    });
  }

  if (log.body) {
    const escapedBody = log.body.replace(/'/g, "'\\''");
    curl += ` \\\n  -d '${escapedBody}'`;
  }

  curl += ` \\\n  "${log.url}"`;

  return curl;
};

export const generateCurlOneLine = (log: NetworkLog): string => {
  let curl = `curl -X ${log.method}`;

  if (log.headers && typeof log.headers === 'object') {
    Object.entries(log.headers).forEach(([key, value]: [string, string]) => {
      const escapedValue = value.replace(/"/g, '\\"');
      curl += ` -H "${key}: ${escapedValue}"`;
    });
  }

  if (log.body) {
    const escapedBody = log.body.replace(/'/g, "'\\''");
    curl += ` -d '${escapedBody}'`;
  }

  curl += ` "${log.url}"`;

  return curl;
};

export const parseCurlCommand = (
  curlCommand: string
): {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | null;
} => {
  const result = {
    method: 'GET',
    url: '',
    headers: {} as Record<string, string>,
    body: null as string | null,
  };

  const methodMatch = curlCommand.match(/-X\s+(\w+)/);
  if (methodMatch && methodMatch[1]) {
    result.method = methodMatch[1];
  }

  const headerMatches = curlCommand.matchAll(/-H\s+"([^:]+):\s*([^"]+)"/g);
  for (const match of headerMatches) {
    const key = match[1];
    const value = match[2];
    if (key && value) {
      result.headers[key] = value;
    }
  }

  const bodyMatch = curlCommand.match(/-d\s+'([^']+)'/);
  if (bodyMatch && bodyMatch[1]) {
    result.body = bodyMatch[1];
  }

  const urlMatch = curlCommand.match(/"(https?:\/\/[^"]+)"/);
  if (urlMatch && urlMatch[1]) {
    result.url = urlMatch[1];
  }

  return result;
};
