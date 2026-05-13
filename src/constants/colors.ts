export const colors = {
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  errorServer: '#A855F7',
  info: '#3B82F6',
  pending: '#94A3B8',

  // UI colors - Dark theme (default)
  dark: {
    background: '#10131a',
    surface: '#10131a',
    surfaceContainer: '#1d2027',
    surfaceContainerLow: '#191b23',
    surfaceContainerHigh: '#272a31',
    surfaceContainerHighest: '#32353c',
    surfaceOverlay: 'rgba(15, 23, 42, 0.95)',
    border: '#424754',
    borderSubtle: 'rgba(255, 255, 255, 0.1)',
    text: '#e1e2ec',
    textSecondary: '#c2c6d6',
    textMuted: '#94A3B8',
    primary: '#adc6ff',
    primaryContainer: '#4d8eff',
    danger: '#EF4444',
    codeBackground: '#191b23',
  },

  // UI colors - Light theme
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceContainer: '#F1F5F9',
    surfaceContainerLow: '#F8FAFC',
    surfaceContainerHigh: '#E2E8F0',
    surfaceContainerHighest: '#CBD5E1',
    surfaceOverlay: 'rgba(248, 250, 252, 0.95)',
    border: '#CBD5E1',
    borderSubtle: 'rgba(0, 0, 0, 0.1)',
    text: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#64748B',
    primary: '#3B82F6',
    primaryContainer: '#3B82F6',
    danger: '#EF4444',
    codeBackground: '#F1F5F9',
  },

  // Method colors
  methods: {
    GET: '#10B981',
    POST: '#F97316',
    PUT: '#0EA5E9',
    PATCH: '#8B5CF6',
    DELETE: '#F43F5E',
    HEAD: '#6B7280',
    OPTIONS: '#78716C',
  },

  // Status code colors
  statusCodes: {
    success: '#10B981', // 2xx
    redirect: '#F59E0B', // 3xx
    clientError: '#EF4444', // 4xx
    serverError: '#A855F7', // 5xx
  },

  // WebSocket colors
  websocket: {
    connecting: '#F59E0B',
    open: '#10B981',
    closing: '#F97316',
    closed: '#94A3B8',
    sent: '#3B82F6',
    received: '#10B981',
  },
} as const;

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceContainer: string;
  surfaceContainerLow: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  surfaceOverlay: string;
  border: string;
  borderSubtle: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryContainer: string;
  danger: string;
  codeBackground: string;
}

export const getThemeColors = (mode: ThemeMode): ThemeColors => {
  return mode === 'dark' ? colors.dark : colors.light;
};

export const getStatusColor = (status?: number): string => {
  if (!status) return colors.pending;
  if (status >= 200 && status < 300) return colors.statusCodes.success;
  if (status >= 300 && status < 400) return colors.statusCodes.redirect;
  if (status >= 400 && status < 500) return colors.statusCodes.clientError;
  if (status >= 500) return colors.statusCodes.serverError;
  return colors.pending;
};

export const getMethodColor = (method: string): string => {
  const upperMethod = method.toUpperCase() as keyof typeof colors.methods;
  return colors.methods[upperMethod] || colors.info;
};

export const getWebSocketStateColor = (
  state: 'connecting' | 'open' | 'closing' | 'closed'
): string => {
  return colors.websocket[state] || colors.pending;
};

export const getWebSocketMessageColor = (
  direction: 'sent' | 'received'
): string => {
  return colors.websocket[direction];
};
