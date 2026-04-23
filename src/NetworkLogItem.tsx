import React, { useState, useMemo, useCallback } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  Share,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import type { NetworkLog, NetworkRequestHeaders } from './types';
import type { ThemeMode } from './constants/colors';
import { colors, getThemeColors, getStatusColor } from './constants/colors';
import { CopyItem } from './CopyItem';
import { JsonViewer } from './components/JsonViewer';
import Icon from './Icon';
import { formatTimestamp } from './utils/formatters';
import { generateCurl } from './utils/curl';
import {
  replayRequest,
  canReplayRequest,
  getReplayWarnings,
} from './utils/replay';
import { exportSingleRequestAsJSON } from './utils/export';
import { detectSensitiveData } from './utils/redact';

interface NetworkLogItemProps {
  log: NetworkLog;
  showRequestHeader?: boolean;
  showResponseHeader?: boolean;
  useCopyToClipboard?: boolean;
  theme?: ThemeMode;
  onDelete?: (logId: number) => void;
  onCloseModal?: () => void;
}

const NetworkLogItem: React.FC<NetworkLogItemProps> = ({
  log,
  useCopyToClipboard,
  showResponseHeader = false,
  showRequestHeader = false,
  theme = 'light',
  onDelete,
  onCloseModal,
}) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const themeColors = useMemo(() => getThemeColors(theme), [theme]);
  const themedStyles = useMemo(
    () => createThemedStyles(themeColors),
    [themeColors]
  );

  const sensitiveDataInfo = useMemo(() => detectSensitiveData(log), [log]);
  const canReplay = useMemo(() => canReplayRequest(log), [log]);
  const replayWarnings = useMemo(() => getReplayWarnings(log), [log]);

  const handleReplay = useCallback(async () => {
    if (replayWarnings.length > 0) {
      Alert.alert(
        'Replay Request',
        `Warning:\n${replayWarnings.join('\n')}\n\nDo you want to continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Replay',
            onPress: async () => {
              setIsReplaying(true);
              try {
                const result = await replayRequest(log);
                if (result.success) {
                  Alert.alert(
                    'Replay Successful',
                    `Status: ${result.response?.status}\nDuration: ${result.response?.duration}ms`
                  );
                } else {
                  Alert.alert('Replay Failed', result.error || 'Unknown error');
                }
              } finally {
                setIsReplaying(false);
              }
            },
          },
        ]
      );
    } else {
      setIsReplaying(true);
      try {
        const result = await replayRequest(log);
        if (result.success) {
          Alert.alert(
            'Replay Successful',
            `Status: ${result.response?.status}\nDuration: ${result.response?.duration}ms`
          );
        } else {
          Alert.alert('Replay Failed', result.error || 'Unknown error');
        }
      } finally {
        setIsReplaying(false);
      }
    }
  }, [log, replayWarnings]);

  const handleShare = useCallback(async () => {
    try {
      const content = exportSingleRequestAsJSON(log);
      onCloseModal?.();
      setTimeout(async () => {
        await Share.share({
          message: content,
          title: `${log.method} ${log.url}`,
        });
      }, 300);
    } catch (error) {
      // User cancelled or error
    }
  }, [log, onCloseModal]);

  const handleDelete = useCallback(() => {
    onDelete?.(log.id);
  }, [log.id, onDelete]);

  const formatHeaders = (headers?: NetworkRequestHeaders): string => {
    if (!headers || typeof headers !== 'object') return 'No headers';
    return Object.entries(headers)
      .map(([key, value]: [string, string]) => `${key}: ${value}`)
      .join('\n');
  };

  const handleHeaderPress = (): void => {
    setExpanded(!expanded);
  };

  const getStatusText = (): string => {
    if (log.response?.status) {
      return log.response.status.toString();
    }
    if (log.error) {
      return 'ERROR';
    }
    return 'PENDING';
  };

  const getDuration = (): number => {
    return log.response?.duration || log.duration || 0;
  };

  const statusColor = getStatusColor(log.response?.status);
  const hasError =
    !!log.error || (log.response?.status && log.response.status >= 400);
  const isSlow = log.isSlow;

  return (
    <View style={themedStyles.logItem}>
      <TouchableOpacity
        style={themedStyles.logHeader}
        onPress={handleHeaderPress}
        activeOpacity={0.7}
      >
        <View style={staticStyles.logSummary}>
          <View style={staticStyles.methodRow}>
            <Text style={[staticStyles.method, { color: colors.info }]}>
              {log.method}
            </Text>
            <Text style={themedStyles.timestamp}>
              {formatTimestamp(log.timestamp)}
            </Text>
          </View>
          <Text style={themedStyles.url} numberOfLines={4}>
            {log.url}
          </Text>
          <View style={staticStyles.statusContainer}>
            <View
              style={[
                staticStyles.statusBadge,
                { backgroundColor: statusColor },
              ]}
            >
              <Text style={staticStyles.statusText}>{getStatusText()}</Text>
            </View>
            <Text
              style={[
                themedStyles.duration,
                isSlow && staticStyles.slowDuration,
              ]}
            >
              {getDuration()}ms
              {isSlow && ' 🐢'}
            </Text>
            {hasError && (
              <View style={staticStyles.errorIndicator}>
                <Text style={staticStyles.errorIndicatorText}>!</Text>
              </View>
            )}
          </View>
        </View>
        <View style={staticStyles.headerActions}>
          {onDelete && (
            <TouchableOpacity
              style={staticStyles.deleteButton}
              onPress={handleDelete}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={staticStyles.deleteButtonText}>✕</Text>
            </TouchableOpacity>
          )}
          <Icon type={expanded ? 'chevronDown' : 'chevronUp'} />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={themedStyles.logDetails}>
          <View style={staticStyles.actionBar}>
            <TouchableOpacity
              style={[
                staticStyles.actionButton,
                !canReplay && staticStyles.actionButtonDisabled,
              ]}
              onPress={handleReplay}
              disabled={!canReplay || isReplaying}
              activeOpacity={0.7}
            >
              {isReplaying ? (
                <ActivityIndicator size="small" color={colors.info} />
              ) : (
                <Text style={staticStyles.actionButtonText}>▶ Replay</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={staticStyles.actionButton}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <Text style={staticStyles.actionButtonText}>↗ Share</Text>
            </TouchableOpacity>
            {(sensitiveDataInfo.hasSensitiveHeaders ||
              sensitiveDataInfo.hasSensitiveBody ||
              sensitiveDataInfo.hasSensitiveUrl) && (
              <View style={staticStyles.sensitiveWarning}>
                <Text style={staticStyles.sensitiveWarningText}>
                  ⚠️ Contains sensitive data
                </Text>
              </View>
            )}
          </View>
          <ScrollView
            style={staticStyles.detailsScroll}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={staticStyles.curlSection}>
              <Text style={themedStyles.sectionTitle}>cURL Command</Text>
              <View style={themedStyles.codeBlock}>
                <Text style={themedStyles.codeText}>{generateCurl(log)}</Text>
                <CopyItem
                  style={staticStyles.copyButton}
                  textToCopy={generateCurl(log)}
                  useCopyToClipboard={useCopyToClipboard}
                />
              </View>
            </View>

            {showRequestHeader && (
              <View style={staticStyles.section}>
                <Text style={themedStyles.sectionTitle}>Request Headers</Text>
                <View style={themedStyles.codeBlock}>
                  <Text style={themedStyles.codeText}>
                    {formatHeaders(log.headers)}
                  </Text>
                </View>
              </View>
            )}

            {log.body && (
              <View style={staticStyles.section}>
                <Text style={themedStyles.sectionTitle}>Request Body</Text>
                <JsonViewer data={log.body} theme={theme} maxInitialDepth={2} />
              </View>
            )}

            {log.response && (
              <>
                {showResponseHeader && (
                  <View style={staticStyles.section}>
                    <Text style={themedStyles.sectionTitle}>
                      Response Headers
                    </Text>
                    <View style={themedStyles.codeBlock}>
                      <Text style={themedStyles.codeText}>
                        {formatHeaders(log.response.headers)}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={staticStyles.section}>
                  <View style={staticStyles.sectionHeader}>
                    <Text style={themedStyles.sectionTitle}>Response Body</Text>
                    <CopyItem
                      useCopyToClipboard={useCopyToClipboard}
                      textToCopy={log.response.body}
                    />
                  </View>
                  <JsonViewer
                    data={log.response.body}
                    theme={theme}
                    maxInitialDepth={2}
                  />
                </View>
              </>
            )}

            {log.error && (
              <View style={staticStyles.section}>
                <Text style={themedStyles.sectionTitle}>Error</Text>
                <View style={[themedStyles.codeBlock, staticStyles.errorBlock]}>
                  <Text style={staticStyles.errorText}>{log.error}</Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

interface ThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  border: string;
  borderLight: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  codeBackground: string;
}

const createThemedStyles = (themeColors: ThemeColors) => ({
  logItem: {
    backgroundColor: themeColors.surface,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  } as ViewStyle,
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  } as ViewStyle,
  url: {
    fontSize: 14,
    color: themeColors.text,
    marginBottom: 6,
    fontWeight: '600',
  } as TextStyle,
  timestamp: {
    fontSize: 11,
    color: themeColors.textMuted,
  } as TextStyle,
  duration: {
    fontSize: 12,
    color: themeColors.textSecondary,
  } as TextStyle,
  logDetails: {
    borderTopWidth: 1,
    borderTopColor: themeColors.borderLight,
    backgroundColor: themeColors.surfaceSecondary,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  } as ViewStyle,
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: themeColors.text,
    marginBottom: 8,
  } as TextStyle,
  codeBlock: {
    backgroundColor: themeColors.codeBackground,
    padding: 12,
    borderRadius: 6,
    position: 'relative',
  } as ViewStyle,
  codeText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: themeColors.textSecondary,
    lineHeight: 18,
  } as TextStyle,
});

const staticStyles = {
  logSummary: {
    flex: 1,
  } as ViewStyle,
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  } as ViewStyle,
  method: {
    fontSize: 14,
    fontWeight: '600',
  } as TextStyle,
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  } as ViewStyle,
  deleteButton: {
    width: 20,
    height: 20,
    borderRadius: 12,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f6f6f6',
  } as ViewStyle,
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  } as TextStyle,
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  } as ViewStyle,
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  } as TextStyle,
  slowDuration: {
    color: colors.warning,
    fontWeight: '600',
  } as TextStyle,
  errorIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  } as ViewStyle,
  errorIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  } as TextStyle,
  detailsScroll: {
    maxHeight: 450,
    padding: 12,
  } as ViewStyle,
  section: {
    marginBottom: 16,
  } as ViewStyle,
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  } as ViewStyle,
  curlSection: {
    marginBottom: 16,
  } as ViewStyle,
  copyButton: {
    position: 'absolute',
    right: 8,
    top: 8,
  } as ViewStyle,
  errorBlock: {
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  } as ViewStyle,
  errorText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.error,
    lineHeight: 18,
  } as TextStyle,
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  } as ViewStyle,
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.info,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  } as ViewStyle,
  actionButtonDisabled: {
    backgroundColor: '#999',
    opacity: 0.6,
  } as ViewStyle,
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  } as TextStyle,
  sensitiveWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  } as ViewStyle,
  sensitiveWarningText: {
    fontSize: 11,
    color: colors.warning,
    fontWeight: '500',
  } as TextStyle,
};

export default NetworkLogItem;
export type { NetworkLogItemProps };
