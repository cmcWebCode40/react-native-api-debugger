export const colors = {
  // Status colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  pending: '#9E9E9E',

  // UI colors - Light theme
  light: {
    background: '#f5f5f5',
    surface: '#ffffff',
    surfaceSecondary: '#f9f9f9',
    border: '#e0e0e0',
    borderLight: '#eeeeee',
    text: '#333333',
    textSecondary: '#666666',
    textMuted: '#999999',
    primary: '#007AFF',
    primaryLight: '#E3F2FD',
    danger: '#E14434',
    codeBackground: '#f0f0f0',
  },

  // UI colors - Dark theme
  dark: {
    background: '#121212',
    surface: '#1E1E1E',
    surfaceSecondary: '#252525',
    border: '#333333',
    borderLight: '#2a2a2a',
    text: '#E0E0E0',
    textSecondary: '#AAAAAA',
    textMuted: '#777777',
    primary: '#0A84FF',
    primaryLight: '#1a3a5c',
    danger: '#FF453A',
    codeBackground: '#2a2a2a',
  },

  // Method colors
  methods: {
    GET: '#4CAF50',
    POST: '#FF9800',
    PUT: '#2196F3',
    PATCH: '#9C27B0',
    DELETE: '#F44336',
    HEAD: '#607D8B',
    OPTIONS: '#795548',
  },

  // Status code colors
  statusCodes: {
    success: '#4CAF50', // 2xx
    redirect: '#FF9800', // 3xx
    clientError: '#F44336', // 4xx
    serverError: '#9C27B0', // 5xx
  },
} as const;

export type ThemeMode = 'light' | 'dark';

export const getThemeColors = (mode: ThemeMode) => {
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
