import type {
  WebSocketLog,
  WebSocketLogListener,
  WebSocketLoggerConfig,
  WebSocketMessage,
} from '../types';
import { DEFAULT_WS_CONFIG } from '../constants/config';

class WebSocketLogger {
  private logs: WebSocketLog[] = [];
  private listeners: WebSocketLogListener[] = [];
  private isEnabled: boolean = true;
  private config: WebSocketLoggerConfig = { ...DEFAULT_WS_CONFIG };
  private connectionMap: Map<WebSocket, WebSocketLog> = new Map();
  private originalWebSocket: typeof WebSocket | null = null;
  private isInterceptorSetup: boolean = false;

  constructor(config?: Partial<WebSocketLoggerConfig>) {
    this.logs = [];
    this.listeners = [];
    this.isEnabled = true;
    this.isInterceptorSetup = false;
    if (config) {
      this.config = { ...DEFAULT_WS_CONFIG, ...config };
    }
  }

  public configure(config: Partial<WebSocketLoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public getConfig(): WebSocketLoggerConfig {
    return { ...this.config };
  }

  private shouldIgnoreUrl(url: string): boolean {
    return this.config.ignoredUrls.some((pattern) => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(url);
      }
      return url.includes(pattern);
    });
  }

  private getMessageSize(data: unknown): number {
    if (typeof data === 'string') {
      return data.length * 2; // Rough estimate for UTF-16
    }
    if (data instanceof ArrayBuffer) {
      return data.byteLength;
    }
    if (typeof Blob !== 'undefined' && data instanceof Blob) {
      return data.size;
    }
    return 0;
  }

  private stringifyData(data: unknown): string {
    if (typeof data === 'string') {
      return data;
    }
    if (data instanceof ArrayBuffer) {
      return `[ArrayBuffer: ${data.byteLength} bytes]`;
    }
    if (typeof Blob !== 'undefined' && data instanceof Blob) {
      return `[Blob: ${data.size} bytes]`;
    }
    return String(data);
  }

  public setupInterceptor(): void {
    if (!this.isEnabled) return;
    if (typeof global.WebSocket === 'undefined') return;
    this.isInterceptorSetup = true;

    this.originalWebSocket = global.WebSocket;
    // eslint-disable-next-line consistent-this
    const self = this;
    const OriginalWebSocket = this.originalWebSocket;

    // Create wrapper class
    function InterceptedWebSocket(
      url: string,
      protocols?: string | string[]
    ): WebSocket {
      const urlString = String(url);

      // Create the actual WebSocket
      const ws: WebSocket = protocols
        ? new OriginalWebSocket(urlString, protocols)
        : new OriginalWebSocket(urlString);

      // Check if should ignore
      if (self.shouldIgnoreUrl(urlString)) {
        return ws;
      }

      const connectionId = Date.now() + Math.random();

      const log: WebSocketLog = {
        id: connectionId,
        url: urlString,
        state: 'connecting',
        protocols: Array.isArray(protocols)
          ? protocols
          : protocols
            ? [protocols]
            : undefined,
        connectTime: new Date().toISOString(),
        messages: [],
        messageCount: { sent: 0, received: 0 },
        bytesReceived: 0,
        bytesSent: 0,
      };

      self.connectionMap.set(ws, log);
      self.addLog(log);

      // Store original event handlers
      let userOnOpen: WebSocket['onopen'] = null;
      let userOnMessage: WebSocket['onmessage'] = null;
      let userOnClose: WebSocket['onclose'] = null;
      let userOnError: WebSocket['onerror'] = null;

      // Override onopen property
      Object.defineProperty(ws, 'onopen', {
        configurable: true,
        get: () => userOnOpen,
        set: (handler: WebSocket['onopen']) => {
          userOnOpen = handler;
        },
      });

      // Override onmessage property
      Object.defineProperty(ws, 'onmessage', {
        configurable: true,
        get: () => userOnMessage,
        set: (handler: WebSocket['onmessage']) => {
          userOnMessage = handler;
        },
      });

      // Override onclose property
      Object.defineProperty(ws, 'onclose', {
        configurable: true,
        get: () => userOnClose,
        set: (handler: WebSocket['onclose']) => {
          userOnClose = handler;
        },
      });

      // Override onerror property
      Object.defineProperty(ws, 'onerror', {
        configurable: true,
        get: () => userOnError,
        set: (handler: WebSocket['onerror']) => {
          userOnError = handler;
        },
      });

      // Add internal event listeners
      const originalAddEventListener = ws.addEventListener.bind(ws);

      // Track events internally
      originalAddEventListener('open', function (this: WebSocket) {
        log.state = 'open';
        log.openTime = new Date().toISOString();
        log.handshakeDuration =
          Date.now() - new Date(log.connectTime).getTime();
        self.updateLog(log);
        if (userOnOpen) {
          userOnOpen.call(this);
        }
      });

      originalAddEventListener('message', function (this: WebSocket, event) {
        if (self.config.captureMessages) {
          const data = (event as MessageEvent).data;
          const size = self.getMessageSize(data);
          const message: WebSocketMessage = {
            id: Date.now() + Math.random(),
            direction: 'received',
            data: self.stringifyData(data),
            dataType: typeof data === 'string' ? 'text' : 'binary',
            timestamp: new Date().toISOString(),
            size,
          };

          // Enforce max messages limit
          if (log.messages.length >= self.config.maxMessagesPerConnection) {
            log.messages.shift();
          }

          log.messages.push(message);
          log.messageCount.received++;
          log.bytesReceived += size;
          self.updateLog(log);
        }
        if (userOnMessage) {
          userOnMessage.call(this, event as MessageEvent);
        }
      });

      originalAddEventListener('close', function (this: WebSocket, event) {
        const closeEvent = event as CloseEvent;
        log.state = 'closed';
        log.closeTime = new Date().toISOString();
        log.closeCode = closeEvent.code;
        log.closeReason =
          closeEvent.reason || self.getCloseCodeDescription(closeEvent.code);
        self.updateLog(log);
        self.connectionMap.delete(ws);
        if (userOnClose) {
          userOnClose.call(this, closeEvent);
        }
      });

      originalAddEventListener('error', function (this: WebSocket, event) {
        log.error = 'WebSocket connection error';
        self.updateLog(log);
        if (userOnError) {
          userOnError.call(this, event);
        }
      });

      // Override send method
      const originalSend = ws.send.bind(ws);
      (ws as { send: typeof ws.send }).send = function (data) {
        if (self.config.captureMessages) {
          const size = self.getMessageSize(data);
          const message: WebSocketMessage = {
            id: Date.now() + Math.random(),
            direction: 'sent',
            data: self.stringifyData(data),
            dataType: typeof data === 'string' ? 'text' : 'binary',
            timestamp: new Date().toISOString(),
            size,
          };

          // Enforce max messages limit
          if (log.messages.length >= self.config.maxMessagesPerConnection) {
            log.messages.shift();
          }

          log.messages.push(message);
          log.messageCount.sent++;
          log.bytesSent += size;
          self.updateLog(log);
        }
        return originalSend(data);
      };

      // Override close method
      const originalClose = ws.close.bind(ws);
      (ws as { close: typeof ws.close }).close = function (code, reason) {
        log.state = 'closing';
        self.updateLog(log);
        return originalClose(code, reason);
      };

      return ws;
    }

    // Copy static properties and prototype
    InterceptedWebSocket.prototype = OriginalWebSocket.prototype;
    Object.defineProperty(InterceptedWebSocket, 'CONNECTING', {
      value: OriginalWebSocket.CONNECTING,
      writable: false,
    });
    Object.defineProperty(InterceptedWebSocket, 'OPEN', {
      value: OriginalWebSocket.OPEN,
      writable: false,
    });
    Object.defineProperty(InterceptedWebSocket, 'CLOSING', {
      value: OriginalWebSocket.CLOSING,
      writable: false,
    });
    Object.defineProperty(InterceptedWebSocket, 'CLOSED', {
      value: OriginalWebSocket.CLOSED,
      writable: false,
    });

    // Replace global WebSocket
    (global as { WebSocket: typeof WebSocket }).WebSocket =
      InterceptedWebSocket as unknown as typeof WebSocket;
  }

  private getCloseCodeDescription(code: number): string {
    const descriptions: Record<number, string> = {
      1000: 'Normal closure',
      1001: 'Going away',
      1002: 'Protocol error',
      1003: 'Unsupported data',
      1005: 'No status received',
      1006: 'Abnormal closure',
      1007: 'Invalid frame payload data',
      1008: 'Policy violation',
      1009: 'Message too big',
      1010: 'Mandatory extension',
      1011: 'Internal server error',
      1015: 'TLS handshake failure',
    };
    return descriptions[code] || `Unknown (${code})`;
  }

  public restoreInterceptor(): void {
    if (this.originalWebSocket) {
      (global as { WebSocket: typeof WebSocket }).WebSocket =
        this.originalWebSocket;
      this.originalWebSocket = null;
    }
  }

  private addLog(log: WebSocketLog): void {
    this.logs.unshift(log);

    if (this.logs.length > this.config.maxConnections) {
      this.logs = this.logs.slice(0, this.config.maxConnections);
    }

    this.notifyListeners();
  }

  private updateLog(log: WebSocketLog): void {
    const index = this.logs.findIndex((l) => l.id === log.id);
    if (index !== -1) {
      this.logs[index] = { ...log };
      this.notifyListeners();
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener([...this.logs]));
  }

  public subscribe(listener: WebSocketLogListener): () => void {
    this.listeners.push(listener);
    // Immediately call with current logs
    listener([...this.logs]);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public clearLogs(): void {
    this.logs = [];
    this.notifyListeners();
  }

  public deleteLog(logId: number): void {
    this.logs = this.logs.filter((log) => log.id !== logId);
    this.notifyListeners();
  }

  public closeConnection(logId: number): void {
    for (const [ws, log] of this.connectionMap.entries()) {
      if (log.id === logId && ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Closed by debugger');
        break;
      }
    }
  }

  public enable(): void {
    this.isEnabled = true;
  }

  public disable(): void {
    this.isEnabled = false;
  }

  public getLogs(): WebSocketLog[] {
    return [...this.logs];
  }

  public getLogCount(): number {
    return this.logs.length;
  }

  public isLoggerEnabled(): boolean {
    return this.isEnabled;
  }

  public getActiveConnectionsCount(): number {
    let count = 0;
    for (const log of this.logs) {
      if (log.state === 'open' || log.state === 'connecting') {
        count++;
      }
    }
    return count;
  }

  public isSetup(): boolean {
    return this.isInterceptorSetup;
  }
}

export const webSocketLogger = new WebSocketLogger();

export { WebSocketLogger };
