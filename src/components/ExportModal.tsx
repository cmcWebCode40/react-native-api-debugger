import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
  Platform,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import type { NetworkLog } from '../types';
import type { ThemeMode, ThemeColors } from '../constants/colors';
import { getThemeColors } from '../constants/colors';
import {
  exportLogs,
  getExportFileName,
  type ExportFormat,
} from '../utils/export';
import { SvgIcon, type IconName } from '../SvgIcon';

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  logs: NetworkLog[];
  theme?: ThemeMode;
}

interface ExportOption {
  format: ExportFormat;
  label: string;
  description: string;
  icon: IconName;
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    format: 'har',
    label: 'HAR File',
    description: 'HTTP Archive format - Import into browser DevTools',
    icon: 'download',
  },
  {
    format: 'postman',
    label: 'Postman Collection',
    description: 'Import directly into Postman',
    icon: 'share',
  },
  {
    format: 'json',
    label: 'JSON',
    description: 'Raw JSON data export',
    icon: 'code',
  },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  visible,
  onClose,
  logs,
  theme = 'dark',
}) => {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const themeColors = getThemeColors(theme);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (logs.length === 0) {
        Alert.alert('No Logs', 'There are no logs to export.');
        return;
      }

      setExporting(format);

      try {
        const content = exportLogs(logs, format);
        const fileName = getExportFileName(format);

        await Share.share({
          message: content,
          title: fileName,
        });
      } catch (error) {
        if (error instanceof Error && error.message !== 'User did not share') {
          Alert.alert('Export Failed', error.message);
        }
      } finally {
        setExporting(null);
      }
    },
    [logs]
  );

  const themedStyles = createThemedStyles(themeColors);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={staticStyles.overlay}>
        <View style={themedStyles.modalContent}>
          {/* Header */}
          <View style={themedStyles.header}>
            <View style={staticStyles.headerLeft}>
              <SvgIcon
                name="download"
                size={20}
                color={themeColors.primaryContainer}
              />
              <Text style={themedStyles.title}>EXPORT LOGS</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={staticStyles.closeButton}
              activeOpacity={0.7}
            >
              <SvgIcon name="x" size={20} color={themeColors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Subtitle */}
          <View style={themedStyles.subtitleContainer}>
            <Text style={themedStyles.subtitle}>
              {logs.length} request{logs.length !== 1 ? 's' : ''} will be
              exported
            </Text>
          </View>

          {/* Export Options */}
          <View style={staticStyles.optionsContainer}>
            {EXPORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.format}
                style={themedStyles.optionButton}
                onPress={() => handleExport(option.format)}
                disabled={exporting !== null}
                activeOpacity={0.7}
              >
                <View style={staticStyles.optionContent}>
                  <View
                    style={[
                      themedStyles.iconContainer,
                      { backgroundColor: `${themeColors.primary}15` },
                    ]}
                  >
                    <SvgIcon
                      name={option.icon}
                      size={18}
                      color={themeColors.primary}
                    />
                  </View>
                  <View style={staticStyles.optionText}>
                    <Text style={themedStyles.optionLabel}>{option.label}</Text>
                    <Text style={themedStyles.optionDescription}>
                      {option.description}
                    </Text>
                  </View>
                  {exporting === option.format ? (
                    <ActivityIndicator
                      size="small"
                      color={themeColors.primary}
                    />
                  ) : (
                    <SvgIcon
                      name="chevronRight"
                      size={18}
                      color={themeColors.textMuted}
                    />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={themedStyles.cancelButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={themedStyles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const createThemedStyles = (themeColors: ThemeColors) => ({
  modalContent: {
    backgroundColor: themeColors.surfaceContainer,
    padding: 0,
    maxHeight: '80%',
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  } as ViewStyle,
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: themeColors.text,
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  } as TextStyle,
  subtitleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.borderSubtle,
    backgroundColor: themeColors.surfaceContainerLow,
  } as ViewStyle,
  subtitle: {
    fontSize: 12,
    color: themeColors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  } as TextStyle,
  optionButton: {
    backgroundColor: themeColors.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.borderSubtle,
  } as ViewStyle,
  iconContainer: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  } as ViewStyle,
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: themeColors.text,
    marginBottom: 2,
  } as TextStyle,
  optionDescription: {
    fontSize: 11,
    color: themeColors.textMuted,
  } as TextStyle,
  cancelButton: {
    backgroundColor: themeColors.surfaceContainerLow,
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: themeColors.border,
  } as ViewStyle,
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: themeColors.primary,
    letterSpacing: 0.5,
  } as TextStyle,
});

const staticStyles = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  } as ViewStyle,
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  } as ViewStyle,
  closeButton: {
    padding: 8,
  } as ViewStyle,
  optionsContainer: {
    paddingVertical: 8,
  } as ViewStyle,
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  optionText: {
    flex: 1,
  } as ViewStyle,
};
