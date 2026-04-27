import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import { SvgIcon } from './SvgIcon';
import { colors, getThemeColors, type ThemeMode } from './constants/colors';

interface NonFloatingButtonProps {
  openModal: () => void;
  hideIcon: () => void;
  logsLength: number;
  errorCount?: number;
  enableDeviceShake?: boolean;
  theme?: ThemeMode;
}

const NonFloatingButton: React.FunctionComponent<NonFloatingButtonProps> = ({
  hideIcon,
  logsLength,
  errorCount = 0,
  openModal,
  enableDeviceShake,
  theme = 'dark',
}) => {
  const themeColors = getThemeColors(theme);

  return (
    <>
      {enableDeviceShake && (
        <View style={styles.floatingCloseIcon}>
          <TouchableOpacity onPress={hideIcon} style={styles.closeButton}>
            <SvgIcon name="x" size={16} color={themeColors.textMuted} />
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.floatingButton}>
        <TouchableOpacity
          onPress={openModal}
          activeOpacity={0.9}
          style={[
            styles.buttonTouchable,
            {
              backgroundColor: themeColors.surfaceContainer,
              borderColor: themeColors.border,
            },
          ]}
        >
          <SvgIcon name="barChart" size={16} color={themeColors.text} />
          <Text
            style={[styles.floatingButtonText, { color: themeColors.text }]}
          >
            {logsLength}
          </Text>
          {errorCount > 0 ? (
            <View style={styles.errorBadge}>
              <Text style={styles.errorBadgeText}>
                {errorCount > 99 ? '99+' : errorCount}
              </Text>
            </View>
          ) : (
            <View style={styles.successBadge}>
              <SvgIcon name="check" size={10} color="#0F172A" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 1000,
  },
  floatingCloseIcon: {
    position: 'absolute',
    bottom: 150,
    right: 24,
    zIndex: 1000,
  },
  buttonTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  errorBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.error,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#10131a',
  },
  errorBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  successBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.success,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#10131a',
  },
});

export default NonFloatingButton;
