import type { LogListener, NetworkLog, NetworkRequestHeaders } from './types';

// Custom XMLHttpRequest interface to handle our modifications
interface CustomXMLHttpRequest extends XMLHttpRequest {
  open: (method: string, url: string) => void;
  send: (body?: Document | any | null) => void;
  setRequestHeader: (header: string, value: string) => void;
}

class NetworkLogger {
  private logs: NetworkLog[] = [];
  private listeners: LogListener[] = [];
  private isEnabled: boolean = true;

  constructor() {
    this.logs = [];
    this.listeners = [];
    this.isEnabled = true;
  }

  public setupInterceptor(): void {
    if (!this.isEnabled) return;

    const originalFetch = global.fetch;

    global.fetch = async (
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> => {
      const startTime: number = Date.now();
      const requestId: number = Date.now() + Math.random();
      const url: string = input.toString();
      const options: RequestInit = init || {};

      const requestLog: NetworkLog = {
        id: requestId,
        method: options.method || 'GET',
        url,
        headers: this.processRequestHeaders(options.headers),
        body: options.body ? this.stringifyBody(options.body) : null,
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

        requestLog.response = {
          status: response.status,
          statusText: response.statusText,
          headers: this.headersToObject(response.headers),
          body: responseBody,
          duration: Date.now() - startTime,
        };

        this.addLog(requestLog);
        return response;
      } catch (error) {
        const errorMessage: string =
          error instanceof Error ? error.message : 'Unknown error';
        requestLog.error = errorMessage;
        requestLog.duration = Date.now() - startTime;
        this.addLog(requestLog);
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
        return originalOpen.call(this, method, url);
      };

      xhr.setRequestHeader = function (header: string, value: string): void {
        requestLog.headers[header] = value;
        return originalSetRequestHeader.call(this, header, value);
      };

      xhr.send = function (body?: Document | any | null): void {
        requestLog.body = body ? self.stringifyBody(body) : null;
        requestLog.startTime = Date.now();

        const originalOnReadyStateChange = xhr.onreadystatechange;

        xhr.onreadystatechange = function (): void {
          if (xhr.readyState === 4) {
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
            requestLog.response = {
              status: xhr.status,
              statusText: xhr.statusText,
              headers: self.parseXHRHeaders(xhr.getAllResponseHeaders()),
              body: responseBody,
              duration: Date.now() - requestLog.startTime,
            };
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

    if (this.logs.length > 100) {
      this.logs = this.logs.slice(0, 100);
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
}

export const networkLogger: NetworkLogger = new NetworkLogger();

export type { NetworkLog, NetworkRequestHeaders, LogListener };
