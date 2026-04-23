import type { NetworkLog, NetworkRequestHeaders } from '../types';

export interface RedactionConfig {
  enabled: boolean;
  headers: string[];
  bodyKeys: string[];
  urlParams: string[];
  preserveLength: boolean;
  maskChar: string;
  visibleChars: number;
}

export const DEFAULT_REDACTION_CONFIG: RedactionConfig = {
  enabled: false,
  headers: [
    'authorization',
    'x-api-key',
    'api-key',
    'x-auth-token',
    'cookie',
    'set-cookie',
    'x-csrf-token',
    'x-access-token',
    'x-refresh-token',
  ],
  bodyKeys: [
    'password',
    'secret',
    'token',
    'apiKey',
    'api_key',
    'accessToken',
    'access_token',
    'refreshToken',
    'refresh_token',
    'creditCard',
    'credit_card',
    'cardNumber',
    'card_number',
    'cvv',
    'ssn',
    'socialSecurityNumber',
  ],
  urlParams: ['token', 'key', 'apiKey', 'api_key', 'secret', 'password'],
  preserveLength: false,
  maskChar: '*',
  visibleChars: 4,
};

export const redactValue = (
  value: string,
  config: Partial<RedactionConfig> = {}
): string => {
  const { preserveLength, maskChar = '*', visibleChars = 4 } = config;

  if (!value || value.length === 0) return value;

  if (preserveLength) {
    if (value.length <= visibleChars * 2) {
      return maskChar.repeat(value.length);
    }
    const start = value.substring(0, visibleChars);
    const end = value.substring(value.length - visibleChars);
    const middle = maskChar.repeat(value.length - visibleChars * 2);
    return `${start}${middle}${end}`;
  }

  if (value.length <= visibleChars) {
    return maskChar.repeat(8);
  }

  const start = value.substring(0, visibleChars);
  return `${start}${maskChar.repeat(8)}`;
};

export const redactHeaders = (
  headers: NetworkRequestHeaders,
  config: Partial<RedactionConfig> = {}
): NetworkRequestHeaders => {
  const headersToRedact = config.headers || DEFAULT_REDACTION_CONFIG.headers;
  const redacted: NetworkRequestHeaders = {};

  for (const [key, value] of Object.entries(headers)) {
    const shouldRedact = headersToRedact.some(
      (h) => h.toLowerCase() === key.toLowerCase()
    );

    if (shouldRedact) {
      redacted[key] = redactValue(value, config);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
};

export const redactUrl = (
  url: string,
  config: Partial<RedactionConfig> = {}
): string => {
  const paramsToRedact = config.urlParams || DEFAULT_REDACTION_CONFIG.urlParams;

  try {
    const urlObj = new URL(url);
    let modified = false;

    paramsToRedact.forEach((param) => {
      if (urlObj.searchParams.has(param)) {
        const value = urlObj.searchParams.get(param);
        if (value) {
          urlObj.searchParams.set(param, redactValue(value, config));
          modified = true;
        }
      }
    });

    return modified ? urlObj.toString() : url;
  } catch {
    return url;
  }
};

export const redactJsonBody = (
  body: string,
  config: Partial<RedactionConfig> = {}
): string => {
  const keysToRedact = config.bodyKeys || DEFAULT_REDACTION_CONFIG.bodyKeys;

  try {
    const parsed = JSON.parse(body);
    const redacted = redactObjectKeys(parsed, keysToRedact, config);
    return JSON.stringify(redacted);
  } catch {
    return body;
  }
};

const redactObjectKeys = (
  obj: unknown,
  keysToRedact: string[],
  config: Partial<RedactionConfig>
): unknown => {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => redactObjectKeys(item, keysToRedact, config));
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      const shouldRedact = keysToRedact.some(
        (k) => k.toLowerCase() === key.toLowerCase()
      );

      if (shouldRedact && typeof value === 'string') {
        result[key] = redactValue(value, config);
      } else if (typeof value === 'object') {
        result[key] = redactObjectKeys(value, keysToRedact, config);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  return obj;
};

export const redactNetworkLog = (
  log: NetworkLog,
  config: Partial<RedactionConfig> = {}
): NetworkLog => {
  const mergedConfig = { ...DEFAULT_REDACTION_CONFIG, ...config };

  if (!mergedConfig.enabled) return log;

  const redactedLog: NetworkLog = {
    ...log,
    url: redactUrl(log.url, mergedConfig),
    headers: redactHeaders(log.headers, mergedConfig),
  };

  if (log.body) {
    redactedLog.body = redactJsonBody(log.body, mergedConfig);
  }

  if (log.response) {
    redactedLog.response = {
      ...log.response,
      headers: redactHeaders(log.response.headers, mergedConfig),
      body: redactJsonBody(log.response.body, mergedConfig),
    };
  }

  return redactedLog;
};

export const detectSensitiveData = (
  log: NetworkLog
): {
  hasSensitiveHeaders: boolean;
  hasSensitiveBody: boolean;
  hasSensitiveUrl: boolean;
  warnings: string[];
} => {
  const warnings: string[] = [];

  const sensitiveHeaders = DEFAULT_REDACTION_CONFIG.headers;
  const hasSensitiveHeaders = Object.keys(log.headers || {}).some((key) =>
    sensitiveHeaders.some((h) => h.toLowerCase() === key.toLowerCase())
  );

  if (hasSensitiveHeaders) {
    warnings.push('Contains sensitive headers (e.g., Authorization)');
  }

  const sensitiveParams = DEFAULT_REDACTION_CONFIG.urlParams;
  let hasSensitiveUrl = false;
  try {
    const urlObj = new URL(log.url);
    hasSensitiveUrl = sensitiveParams.some((param) =>
      urlObj.searchParams.has(param)
    );
    if (hasSensitiveUrl) {
      warnings.push('URL contains sensitive query parameters');
    }
  } catch {
    // Invalid URL
  }

  const sensitiveBodyKeys = DEFAULT_REDACTION_CONFIG.bodyKeys;
  let hasSensitiveBody = false;

  const checkBodyForKeys = (body: string | null | undefined): boolean => {
    if (!body) return false;
    try {
      const parsed = JSON.parse(body);
      return containsSensitiveKeys(parsed, sensitiveBodyKeys);
    } catch {
      return sensitiveBodyKeys.some((key) =>
        body.toLowerCase().includes(key.toLowerCase())
      );
    }
  };

  hasSensitiveBody =
    checkBodyForKeys(log.body) || checkBodyForKeys(log.response?.body);

  if (hasSensitiveBody) {
    warnings.push('Body may contain sensitive data');
  }

  return {
    hasSensitiveHeaders,
    hasSensitiveBody,
    hasSensitiveUrl,
    warnings,
  };
};

const containsSensitiveKeys = (
  obj: unknown,
  keysToCheck: string[]
): boolean => {
  if (obj === null || obj === undefined) return false;

  if (Array.isArray(obj)) {
    return obj.some((item) => containsSensitiveKeys(item, keysToCheck));
  }

  if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      if (keysToCheck.some((k) => k.toLowerCase() === key.toLowerCase())) {
        return true;
      }
      if (
        typeof value === 'object' &&
        containsSensitiveKeys(value, keysToCheck)
      ) {
        return true;
      }
    }
  }

  return false;
};
