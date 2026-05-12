import type {
  LogListener,
  NetworkLog,
  NetworkLoggerConfig,
  NetworkRequestHeaders,
} from '../types';
import { DEFAULT_CONFIG } from '../constants/config';
import { shouldIgnoreUrl, shouldIgnoreDomain } from '../utils/filters';

interface CustomXMLHttpRequest extends XMLHttpRequest {
  open: (method: string, url: string) => void;
  send: (body?: Document | any | null) => void;
  setRequestHeader: (header: string, value: string) => void;
}

class NetworkLogger {
  private logs: NetworkLog[] = [];
  private listeners: LogListener[] = [];
  private isEnabled: boolean = true;
  private config: NetworkLoggerConfig = { ...DEFAULT_CONFIG };
  private isInterceptorSetup: boolean = false;

  constructor(config?: Partial<NetworkLoggerConfig>) {
    this.logs = [];
    this.listeners = [];
    this.isEnabled = true;
    this.isInterceptorSetup = false;
    if (config) {
      this.config = { ...DEFAULT_CONFIG, ...config };
    }
  }

  public configure(config: Partial<NetworkLoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public getConfig(): NetworkLoggerConfig {
    return { ...this.config };
  }

  private shouldIgnoreRequest(url: string, method: string): boolean {
    if (shouldIgnoreUrl(url, this.config.ignoredUrls)) {
      return true;
    }
    if (shouldIgnoreDomain(url, this.config.ignoredDomains)) {
      return true;
    }
    if (
      this.config.ignoredMethods.length > 0 &&
      this.config.ignoredMethods
        .map((m) => m.toUpperCase())
        .includes(method.toUpperCase())
    ) {
      return true;
    }
    return false;
  }

  public setupInterceptor(): void {
    if (!this.isEnabled) return;
    this.isInterceptorSetup = true;

    const originalFetch = global.fetch;
    // eslint-disable-next-line consistent-this
    const self = this;

    global.fetch = async (
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> => {
      const startTime: number = Date.now();
      const requestId: number = Date.now() + Math.random();
      const url: string = input.toString();
      const options: RequestInit = init || {};
      const method = options.method || 'GET';

      if (self.shouldIgnoreRequest(url, method)) {
        return originalFetch(input, init);
      }

      const requestLog: NetworkLog = {
        id: requestId,
        method,
        url,
        headers: self.processRequestHeaders(options.headers),
        body: options.body ? self.stringifyBody(options.body) : null,
        timestamp: new Date().toISOString(),
        startTime,
      };

      try {
        const response: Response = await originalFetch(input, init);
        const responseClone: Response = response.clone();
        let responseBody: string = '';

        try {
          responseBody = await responseClone.text();
        } catch (e) {
          responseBody = 'Unable to read response body';
        }

        const duration = Date.now() - startTime;
        requestLog.response = {
          status: response.status,
          statusText: response.statusText,
          headers: self.headersToObject(response.headers),
          body: responseBody,
          duration,
        };
        requestLog.isSlow = duration > self.config.slowRequestThreshold;

        self.addLog(requestLog);
        return response;
      } catch (error) {
        const errorMessage: string =
          error instanceof Error ? error.message : 'Unknown error';
        requestLog.error = errorMessage;
        requestLog.duration = Date.now() - startTime;
        self.addLog(requestLog);
        throw error;
      }
    };

    this.setupXHRInterceptor();
  }

  private setupXHRInterceptor(): void {
    const originalXHR = global.XMLHttpRequest;
    // eslint-disable-next-line consistent-this
    const self = this;

    global.XMLHttpRequest = function (): CustomXMLHttpRequest {
      const xhr = new originalXHR() as CustomXMLHttpRequest;
      const requestId: number = Date.now() + Math.random();
      let shouldIgnore = false;
      let requestLog: NetworkLog = {
        id: requestId,
        method: '',
        url: '',
        headers: {},
        body: null,
        timestamp: new Date().toISOString(),
        startTime: 0,
      };

      const originalOpen = xhr.open;
      const originalSend = xhr.send;
      const originalSetRequestHeader = xhr.setRequestHeader;

      xhr.open = function (method: string, url: string): void {
        requestLog.method = method;
        requestLog.url = url;
        shouldIgnore = self.shouldIgnoreRequest(url, method);
        return originalOpen.call(this, method, url);
      };

      xhr.setRequestHeader = function (header: string, value: string): void {
        if (!shouldIgnore) {
          requestLog.headers[header] = value;
        }
        return originalSetRequestHeader.call(this, header, value);
      };

      xhr.send = function (body?: Document | any | null): void {
        if (shouldIgnore) {
          return originalSend.call(this, body);
        }

        requestLog.body = body ? self.stringifyBody(body) : null;
        requestLog.startTime = Date.now();

        const originalOnReadyStateChange = xhr.onreadystatechange;

        xhr.onreadystatechange = function (): void {
          if (xhr.readyState === 4 && !shouldIgnore) {
            let responseBody: string = '';

            try {
              switch (xhr.responseType) {
                case '':
                case 'text':
                  responseBody = xhr.responseText || '';
                  break;
                case 'json':
                  try {
                    responseBody = JSON.stringify(xhr.response);
                  } catch {
                    responseBody = '[JSON Response - Unable to stringify]';
                  }
                  break;
                case 'blob':
                  responseBody = `[Blob Response - Size: ${xhr.response?.size || 'unknown'} bytes]`;
                  break;
                case 'arraybuffer':
                  responseBody = `[ArrayBuffer Response - Size: ${xhr.response?.byteLength || 'unknown'} bytes]`;
                  break;
                case 'document':
                  responseBody = '[Document Response]';
                  break;
                default:
                  responseBody = '[Unknown Response Type]';
              }
            } catch (error) {
              responseBody = `[Error reading response: ${error instanceof Error ? error.message : 'Unknown error'}]`;
            }
            const duration = Date.now() - requestLog.startTime;
            requestLog.response = {
              status: xhr.status,
              statusText: xhr.statusText,
              headers: self.parseXHRHeaders(xhr.getAllResponseHeaders()),
              body: responseBody,
              duration,
            };
            requestLog.isSlow = duration > self.config.slowRequestThreshold;
            self.addLog(requestLog);
          }

          if (originalOnReadyStateChange) {
            originalOnReadyStateChange.call(this, body);
          }
        };

        return originalSend.call(this, body);
      };

      return xhr;
    } as any;
  }

  private processRequestHeaders(headers?: HeadersInit_): NetworkRequestHeaders {
    const processedHeaders: NetworkRequestHeaders = {};

    if (!headers) return processedHeaders;

    if (headers instanceof Headers) {
      for (const [key, value] of headers.entries()) {
        processedHeaders[key] = value;
      }
    } else if (Array.isArray(headers)) {
      headers.forEach(([key, value]) => {
        processedHeaders[key] = value;
      });
    } else if (typeof headers === 'object') {
      Object.entries(headers).forEach(([key, value]) => {
        processedHeaders[key] = value;
      });
    }

    return processedHeaders;
  }

  private stringifyBody(body: BodyInit_ | Document | any): string {
    try {
      if (typeof body === 'string') {
        return body;
      } else if (body instanceof FormData) {
        return '[FormData]';
      } else if (body instanceof URLSearchParams) {
        return body.toString();
      } else if (body instanceof ArrayBuffer || body instanceof Uint8Array) {
        return '[Binary Data]';
      } else if (body && typeof body === 'object') {
        return JSON.stringify(body);
      } else {
        return String(body);
      }
    } catch (error) {
      return '[Unable to stringify body]';
    }
  }

  private headersToObject(headers: Headers): NetworkRequestHeaders {
    const obj: NetworkRequestHeaders = {};
    if (headers && headers.entries) {
      for (const [key, value] of headers.entries()) {
        obj[key] = value;
      }
    }
    return obj;
  }

  private parseXHRHeaders(headerString: string): NetworkRequestHeaders {
    const headers: NetworkRequestHeaders = {};
    if (!headerString) return headers;

    headerString.split('\r\n').forEach((line) => {
      const [key, ...valueParts] = line.split(': ');
      if (key && valueParts.length > 0) {
        headers[key.toLowerCase()] = valueParts.join(': ');
      }
    });

    return headers;
  }

  private addLog(log: NetworkLog): void {
    this.logs.unshift(log);

    if (this.logs.length > this.config.maxLogs) {
      this.logs = this.logs.slice(0, this.config.maxLogs);
    }

    this.listeners.forEach((listener: LogListener) => listener([...this.logs]));
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.push(listener);
    return (): void => {
      this.listeners = this.listeners.filter(
        (l: LogListener) => l !== listener
      );
    };
  }

  public clearLogs(): void {
    this.logs = [];
    this.listeners.forEach((listener: LogListener) => listener([]));
  }

  public deleteLog(logId: number): void {
    this.logs = this.logs.filter((log) => log.id !== logId);
    this.listeners.forEach((listener: LogListener) => listener([...this.logs]));
  }

  public enable(): void {
    this.isEnabled = true;
  }

  public disable(): void {
    this.isEnabled = false;
  }

  public getLogs(): NetworkLog[] {
    return [...this.logs];
  }

  public getLogCount(): number {
    return this.logs.length;
  }

  public isLoggerEnabled(): boolean {
    return this.isEnabled;
  }

  public isSetup(): boolean {
    return this.isInterceptorSetup;
  }
}

export const networkLogger = new NetworkLogger();

export type { NetworkLog, NetworkRequestHeaders, LogListener };
