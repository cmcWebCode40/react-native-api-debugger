import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import type { NetworkLog } from '../types';
import type { ThemeMode } from '../constants/colors';
import { getThemeColors } from '../constants/colors';
import {
  exportLogs,
  getExportFileName,
  type ExportFormat,
} from '../utils/export';

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
  icon: string;
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    format: 'har',
    label: 'HAR File',
    description: 'HTTP Archive format - Import into browser DevTools',
    icon: '📦',
  },
  {
    format: 'postman',
    label: 'Postman Collection',
    description: 'Import directly into Postman',
    icon: '📮',
  },
  {
    format: 'json',
    label: 'JSON',
    description: 'Raw JSON data export',
    icon: '📄',
  },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  visible,
  onClose,
  logs,
  theme = 'light',
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
          <View style={staticStyles.header}>
            <Text style={themedStyles.title}>Export Logs</Text>
            <TouchableOpacity
              onPress={onClose}
              style={staticStyles.closeButton}
            >
              <Text style={themedStyles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={themedStyles.subtitle}>
            {logs.length} request{logs.length !== 1 ? 's' : ''} will be exported
          </Text>

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
                  <Text style={staticStyles.optionIcon}>{option.icon}</Text>
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
                    <Text style={themedStyles.chevron}>›</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

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

interface ThemeColors {
  background: string;
  surface: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
}

const createThemedStyles = (themeColors: ThemeColors) => ({
  modalContent: {
    backgroundColor: themeColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  } as ViewStyle,
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: themeColors.text,
  } as TextStyle,
  closeButtonText: {
    fontSize: 20,
    color: themeColors.textMuted,
  } as TextStyle,
  subtitle: {
    fontSize: 14,
    color: themeColors.textSecondary,
    marginBottom: 20,
  } as TextStyle,
  optionButton: {
    backgroundColor: themeColors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: themeColors.border,
  } as ViewStyle,
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.text,
    marginBottom: 2,
  } as TextStyle,
  optionDescription: {
    fontSize: 12,
    color: themeColors.textSecondary,
  } as TextStyle,
  chevron: {
    fontSize: 24,
    color: themeColors.textMuted,
  } as TextStyle,
  cancelButton: {
    backgroundColor: themeColors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: themeColors.border,
  } as ViewStyle,
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.primary,
  } as TextStyle,
});

const staticStyles = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  } as ViewStyle,
  closeButton: {
    padding: 8,
  } as ViewStyle,
  optionsContainer: {
    marginBottom: 8,
  } as ViewStyle,
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  optionIcon: {
    fontSize: 28,
    marginRight: 16,
  } as TextStyle,
  optionText: {
    flex: 1,
  } as ViewStyle,
};
