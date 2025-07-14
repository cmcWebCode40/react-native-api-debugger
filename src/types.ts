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
}

export type LogListener = (logs: NetworkLog[]) => void;

export interface NetworkLogger {
  subscribe: (listener: LogListener) => () => void;
  clearLogs: () => void;
  enable: () => void;
  disable: () => void;
  getLogs?: () => NetworkLog[];
  getLogCount?: () => number;
  isLoggerEnabled?: () => boolean;
}
