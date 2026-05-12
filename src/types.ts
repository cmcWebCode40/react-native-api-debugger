export interface NetworkRequestHeaders {
  [key: string]: string;
}

export interface NetworkResponse {
  status: number;
  statusText: string;
  headers: NetworkRequestHeaders;
  body: string;
  duration: number;
}

export interface NetworkLog {
  id: number;
  method: string;
  url: string;
  headers: NetworkRequestHeaders;
  body: string | null;
  timestamp: string;
  startTime: number;
  response?: NetworkResponse;
  error?: string;
  duration?: number;
  isSlow?: boolean;
  bookmarked?: boolean;
}

export type LogListener = (logs: NetworkLog[]) => void;

export interface NetworkLoggerConfig {
  maxLogs: number;
  ignoredUrls: string[];
  ignoredDomains: string[];
  ignoredMethods: string[];
  redactHeaders: string[];
  enableRedaction: boolean;
  slowRequestThreshold: number;
}

export interface NetworkLogger {
  subscribe: (listener: LogListener) => () => void;
  clearLogs: () => void;
  deleteLog: (logId: number) => void;
  enable: () => void;
  disable: () => void;
  getLogs?: () => NetworkLog[];
  getLogCount?: () => number;
  isLoggerEnabled?: () => boolean;
  configure?: (config: Partial<NetworkLoggerConfig>) => void;
  getConfig?: () => NetworkLoggerConfig;
}

// ============================================
// WebSocket Types
// ============================================

export type WebSocketState = 'connecting' | 'open' | 'closing' | 'closed';

export type WebSocketMessageDirection = 'sent' | 'received';

export type WebSocketDataType = 'text' | 'binary';

export interface WebSocketMessage {
  id: number;
  direction: WebSocketMessageDirection;
  data: string;
  dataType: WebSocketDataType;
  timestamp: string;
  size: number;
}

export interface WebSocketLog {
  id: number;
  url: string;
  state: WebSocketState;
  protocols?: string[];

  // Connection lifecycle
  connectTime: string;
  openTime?: string;
  closeTime?: string;
  closeCode?: number;
  closeReason?: string;

  // Messages
  messages: WebSocketMessage[];
  messageCount: { sent: number; received: number };

  // Errors
  error?: string;

  // Metadata
  handshakeDuration?: number;
  bytesReceived: number;
  bytesSent: number;
}

export interface WebSocketLoggerConfig {
  maxConnections: number;
  maxMessagesPerConnection: number;
  ignoredUrls: string[];
  captureMessages: boolean;
}

export type WebSocketLogListener = (logs: WebSocketLog[]) => void;

export interface IWebSocketLogger {
  subscribe: (listener: WebSocketLogListener) => () => void;
  clearLogs: () => void;
  deleteLog: (logId: number) => void;
  enable: () => void;
  disable: () => void;
  getLogs?: () => WebSocketLog[];
  getLogCount?: () => number;
  isLoggerEnabled?: () => boolean;
  configure?: (config: Partial<WebSocketLoggerConfig>) => void;
  getConfig?: () => WebSocketLoggerConfig;
  closeConnection?: (logId: number) => void;
}
