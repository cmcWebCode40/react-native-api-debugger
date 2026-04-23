import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '../constants/colors';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'pending';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'small' | 'medium';
  style?: StyleProp<ViewStyle>;
}

const variantColors: Record<BadgeVariant, string> = {
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
  info: colors.info,
  pending: colors.pending,
};

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'info',
  size = 'medium',
  style,
}) => {
  const backgroundColor = variantColors[variant];
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor },
        isSmall && styles.badgeSmall,
        style,
      ]}
    >
      <Text style={[styles.label, isSmall && styles.labelSmall]}>{label}</Text>
    </View>
  );
};

interface StatusBadgeProps {
  status?: number;
  hasError?: boolean;
  size?: 'small' | 'medium';
  style?: StyleProp<ViewStyle>;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  hasError,
  size = 'medium',
  style,
}) => {
  const getVariant = (): BadgeVariant => {
    if (hasError) return 'error';
    if (!status) return 'pending';
    if (status >= 200 && status < 300) return 'success';
    if (status >= 300 && status < 400) return 'warning';
    if (status >= 400) return 'error';
    return 'pending';
  };

  const getLabel = (): string => {
    if (hasError) return 'ERROR';
    if (!status) return 'PENDING';
    return status.toString();
  };

  return (
    <Badge
      label={getLabel()}
      variant={getVariant()}
      size={size}
      style={style}
    />
  );
};

interface MethodBadgeProps {
  method: string;
  size?: 'small' | 'medium';
  style?: StyleProp<ViewStyle>;
}

const methodColors: Record<string, string> = {
  GET: colors.success,
  POST: colors.warning,
  PUT: colors.info,
  PATCH: '#9C27B0',
  DELETE: colors.error,
  HEAD: '#607D8B',
  OPTIONS: '#795548',
};

export const MethodBadge: React.FC<MethodBadgeProps> = ({
  method,
  size = 'medium',
  style,
}) => {
  const upperMethod = method.toUpperCase();
  const backgroundColor = methodColors[upperMethod] || colors.info;

  return (
    <View
      style={[
        styles.methodBadge,
        { backgroundColor },
        size === 'small' && styles.badgeSmall,
        style,
      ]}
    >
      <Text style={[styles.label, size === 'small' && styles.labelSmall]}>
        {upperMethod}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  labelSmall: {
    fontSize: 10,
  },
  methodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
});
