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
