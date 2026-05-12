import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type { ThemeMode } from '../../constants/colors';
import { colors, getThemeColors } from '../../constants/colors';

interface FilterChipProps {
  label: string;
  isActive?: boolean;
  onPress: () => void;
  variant?: 'default' | 'error';
  theme?: ThemeMode;
  style?: StyleProp<ViewStyle>;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  isActive = false,
  onPress,
  variant = 'default',
  theme = 'light',
  style,
}) => {
  const themeColors = getThemeColors(theme);
  const isError = variant === 'error' && isActive;

  const chipStyle = [
    styles.chip,
    {
      backgroundColor: isActive
        ? isError
          ? colors.error
          : themeColors.primary
        : themeColors.background,
      borderColor: isActive
        ? isError
          ? colors.error
          : themeColors.primary
        : themeColors.border,
    },
    style,
  ];

  const textStyle = [
    styles.chipText,
    {
      color: isActive ? '#fff' : themeColors.textSecondary,
    },
  ];

  return (
    <TouchableOpacity style={chipStyle} onPress={onPress} activeOpacity={0.7}>
      <Text style={textStyle}>{label}</Text>
    </TouchableOpacity>
  );
};

interface FilterChipGroupProps {
  options: { key: string; label: string }[];
  selectedKey: string;
  onSelect: (key: string) => void;
  theme?: ThemeMode;
  errorKeys?: string[];
}

export const FilterChipGroup: React.FC<FilterChipGroupProps> = ({
  options,
  selectedKey,
  onSelect,
  theme = 'light',
  errorKeys = ['error'],
}) => {
  return (
    <>
      {options.map((option) => (
        <FilterChip
          key={option.key}
          label={option.label}
          isActive={selectedKey === option.key}
          onPress={() => onSelect(option.key)}
          variant={errorKeys.includes(option.key) ? 'error' : 'default'}
          theme={theme}
        />
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
