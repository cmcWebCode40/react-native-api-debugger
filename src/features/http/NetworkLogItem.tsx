import React, { useState, useMemo, useCallback } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  Share,
  Platform,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import type { NetworkLog, NetworkRequestHeaders } from '../../types';
import type { ThemeMode, ThemeColors } from '../../constants/colors';
import {
  colors,
  getThemeColors,
  getStatusColor,
  getMethodColor,
} from '../../constants/colors';
import { CopyItem } from '../../components/common';
import { JsonViewer } from '../../components/common';
import { SvgIcon } from '../../icons';
import { formatTimestamp } from '../../utils/formatters';
import { generateCurl } from '../../utils/curl';
import {
  replayRequest,
  canReplayRequest,
  getReplayWarnings,
} from '../../utils/replay';
import { exportSingleRequestAsJSON } from '../../utils/export';
import { detectSensitiveData, redactHeaders } from '../../utils/redact';

interface NetworkLogItemProps {
  log: NetworkLog;
  showRequestHeader?: boolean;
  showResponseHeader?: boolean;
  useCopyToClipboard?: boolean;
  theme?: ThemeMode;
  onDelete?: (logId: number) => void;
  onCloseModal?: () => void;
  isAlternate?: boolean;
}

const NetworkLogItem: React.FC<NetworkLogItemProps> = ({
  log,
  useCopyToClipboard,
  showResponseHeader = false,
  showRequestHeader = false,
  theme = 'dark',
  onDelete,
  onCloseModal,
  isAlternate = false,
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

  const statusColor = getStatusColor(log.response?.status);
  const methodColor = getMethodColor(log.method);
  const hasError =
    !!log.error || (log.response?.status && log.response.status >= 400);
  const isPending = !log.response && !log.error;

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
    } catch {
      // User cancelled or error
    }
  }, [log, onCloseModal]);

  const handleDelete = useCallback(() => {
    onDelete?.(log.id);
  }, [log.id, onDelete]);

  const formatHeaders = (headers?: NetworkRequestHeaders): string => {
    if (!headers || typeof headers !== 'object') return 'No headers';
    const redactedHeaders = redactHeaders(headers);
    return Object.entries(redactedHeaders)
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
      return 'ERR';
    }
    return '--';
  };

  const getDuration = (): string => {
    const duration = log.response?.duration || log.duration || 0;
    if (duration === 0 && isPending) return '--';
    if (duration >= 1000) return `${(duration / 1000).toFixed(1)}s`;
    return `${duration}ms`;
  };

  const getUrlPath = (): string => {
    try {
      const url = new URL(log.url);
      return url.pathname + url.search;
    } catch {
      return log.url;
    }
  };

  const getUrlDomain = (): string => {
    try {
      const url = new URL(log.url);
      return url.hostname;
    } catch {
      return '';
    }
  };

  const borderColor = hasError
    ? statusColor
    : expanded
      ? methodColor
      : 'transparent';

  const rowBackgroundColor = isAlternate
    ? themeColors.surfaceContainerLow
    : themeColors.surface;

  return (
    <View
      style={[
        themedStyles.logItem,
        { borderLeftColor: borderColor, backgroundColor: rowBackgroundColor },
      ]}
    >
      <TouchableOpacity
        style={themedStyles.logHeader}
        onPress={handleHeaderPress}
        activeOpacity={0.7}
      >
        {/* Status Code */}
        <View style={staticStyles.statusColumn}>
          <Text style={[staticStyles.statusCode, { color: statusColor }]}>
            {getStatusText()}
          </Text>
        </View>

        {/* Method Badge */}
        <View style={staticStyles.methodColumn}>
          <View
            style={[
              staticStyles.methodBadge,
              { backgroundColor: `${methodColor}15` },
            ]}
          >
            <Text style={[staticStyles.methodText, { color: methodColor }]}>
              {log.method}
            </Text>
          </View>
        </View>

        {/* URL */}
        <View style={staticStyles.urlColumn}>
          <Text style={themedStyles.urlPath} numberOfLines={1}>
            {getUrlPath()}
          </Text>
          <Text style={themedStyles.urlDomain} numberOfLines={1}>
            {getUrlDomain()}
          </Text>
        </View>

        {/* Duration & Time */}
        <View style={staticStyles.durationColumn}>
          <Text style={themedStyles.duration}>{getDuration()}</Text>
          <Text style={themedStyles.timestamp}>
            {isPending ? 'Pending' : formatTimestamp(log.timestamp)}
          </Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={themedStyles.logDetails}>
          {/* Full URL Display */}
          <View style={themedStyles.fullUrlContainer}>
            <View style={staticStyles.urlHeader}>
              <View
                style={[
                  staticStyles.methodBadgeLarge,
                  { backgroundColor: `${methodColor}15` },
                ]}
              >
                <Text
                  style={[staticStyles.methodTextLarge, { color: methodColor }]}
                >
                  {log.method}
                </Text>
              </View>
              <Text style={[staticStyles.statusLarge, { color: statusColor }]}>
                {getStatusText()}{' '}
                {log.response?.statusText && (
                  <Text style={themedStyles.statusTextLabel}>
                    {log.response.statusText}
                  </Text>
                )}
              </Text>
              <Text style={themedStyles.durationLarge}>{getDuration()}</Text>
            </View>
            <Text style={themedStyles.fullUrl} numberOfLines={3}>
              {log.url}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={staticStyles.actionBar}>
            <TouchableOpacity
              style={[
                themedStyles.actionButton,
                !canReplay && staticStyles.actionButtonDisabled,
              ]}
              onPress={handleReplay}
              disabled={!canReplay || isReplaying}
              activeOpacity={0.7}
            >
              {isReplaying ? (
                <ActivityIndicator size="small" color={themeColors.text} />
              ) : (
                <>
                  <SvgIcon name="refresh" size={14} color={themeColors.text} />
                  <Text style={themedStyles.actionButtonText}>REPLAY</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={themedStyles.actionButton}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <SvgIcon name="share" size={14} color={themeColors.text} />
              <Text style={themedStyles.actionButtonText}>SHARE</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={themedStyles.actionButton}
              activeOpacity={0.7}
            >
              <CopyItem
                size={8}
                useCopyToClipboard={useCopyToClipboard}
                textToCopy={exportSingleRequestAsJSON(log)}
              />
            </TouchableOpacity>
            {onDelete && (
              <TouchableOpacity
                style={[themedStyles.actionButton, staticStyles.deleteButton]}
                onPress={handleDelete}
                activeOpacity={0.7}
              >
                <SvgIcon name="trash" size={14} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>

          {sensitiveDataInfo.warnings.length > 0 && (
            <View style={staticStyles.warningBanner}>
              <SvgIcon name="alertCircle" size={14} color={colors.warning} />
              <Text style={staticStyles.warningText}>
                Contains sensitive data
              </Text>
            </View>
          )}

          <ScrollView
            style={staticStyles.detailsScroll}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* cURL Command */}
            <CollapsibleSection
              title="CURL COMMAND"
              theme={theme}
              defaultExpanded={false}
            >
              <View style={themedStyles.codeBlock}>
                <Text style={themedStyles.codeText}>{generateCurl(log)}</Text>
                <View style={staticStyles.copyButtonAbsolute}>
                  <CopyItem
                    useCopyToClipboard={useCopyToClipboard}
                    textToCopy={generateCurl(log, { redact: false })}
                  />
                </View>
              </View>
            </CollapsibleSection>

            {/* Request Headers */}
            {showRequestHeader && (
              <CollapsibleSection
                title="REQUEST HEADERS"
                theme={theme}
                defaultExpanded={false}
              >
                <View style={themedStyles.codeBlock}>
                  <Text style={themedStyles.codeText}>
                    {formatHeaders(log.headers)}
                  </Text>
                  <View style={staticStyles.copyButtonAbsolute}>
                    <CopyItem
                      useCopyToClipboard={useCopyToClipboard}
                      textToCopy={formatHeaders(log.headers)}
                    />
                  </View>
                </View>
              </CollapsibleSection>
            )}

            {/* Request Body */}
            {log.body && (
              <CollapsibleSection
                title="REQUEST BODY"
                theme={theme}
                defaultExpanded={false}
              >
                <View style={staticStyles.jsonContainer}>
                  <JsonViewer
                    data={log.body}
                    theme={theme}
                    maxInitialDepth={2}
                  />
                  <View style={staticStyles.copyButtonFloat}>
                    <CopyItem
                      useCopyToClipboard={useCopyToClipboard}
                      textToCopy={log.body}
                    />
                  </View>
                </View>
              </CollapsibleSection>
            )}

            {/* Response Headers */}
            {log.response && showResponseHeader && (
              <CollapsibleSection
                title="RESPONSE HEADERS"
                theme={theme}
                defaultExpanded={false}
              >
                <View style={themedStyles.codeBlock}>
                  <Text style={themedStyles.codeText}>
                    {formatHeaders(log.response.headers)}
                  </Text>
                  <View style={staticStyles.copyButtonAbsolute}>
                    <CopyItem
                      useCopyToClipboard={useCopyToClipboard}
                      textToCopy={formatHeaders(log.response.headers)}
                    />
                  </View>
                </View>
              </CollapsibleSection>
            )}

            {/* Response Body */}
            {log.response && (
              <CollapsibleSection
                title="RESPONSE BODY"
                theme={theme}
                defaultExpanded={true}
                badge="JSON"
              >
                <View style={staticStyles.jsonContainer}>
                  <JsonViewer
                    data={log.response.body}
                    theme={theme}
                    maxInitialDepth={3}
                  />
                  <View style={staticStyles.copyButtonFloat}>
                    <CopyItem
                      useCopyToClipboard={useCopyToClipboard}
                      textToCopy={log.response.body}
                    />
                  </View>
                </View>
              </CollapsibleSection>
            )}

            {/* Error */}
            {log.error && (
              <CollapsibleSection
                title="ERROR"
                theme={theme}
                defaultExpanded={true}
              >
                <View style={[themedStyles.codeBlock, staticStyles.errorBlock]}>
                  <Text style={staticStyles.errorText}>{log.error}</Text>
                  <View style={staticStyles.copyButtonAbsolute}>
                    <CopyItem
                      useCopyToClipboard={useCopyToClipboard}
                      textToCopy={log.error}
                    />
                  </View>
                </View>
              </CollapsibleSection>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

// Collapsible Section Component
interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  theme: ThemeMode;
  defaultExpanded?: boolean;
  badge?: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  theme,
  defaultExpanded = false,
  badge,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const themeColors = getThemeColors(theme);

  return (
    <View
      style={[
        collapsibleStyles.container,
        { backgroundColor: themeColors.surfaceContainer },
      ]}
    >
      <TouchableOpacity
        style={[
          collapsibleStyles.header,
          { borderBottomColor: themeColors.borderSubtle },
          isExpanded && collapsibleStyles.headerExpanded,
        ]}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={collapsibleStyles.titleRow}>
          <SvgIcon name="code" size={14} color={themeColors.textMuted} />
          <Text
            style={[collapsibleStyles.title, { color: themeColors.textMuted }]}
          >
            {title}
          </Text>
          {badge && (
            <View
              style={[
                collapsibleStyles.badge,
                { backgroundColor: themeColors.surfaceContainerHigh },
              ]}
            >
              <Text
                style={[
                  collapsibleStyles.badgeText,
                  { color: themeColors.textMuted },
                ]}
              >
                {badge}
              </Text>
            </View>
          )}
        </View>
        <SvgIcon
          name={isExpanded ? 'chevronUp' : 'chevronDown'}
          size={16}
          color={themeColors.textMuted}
        />
      </TouchableOpacity>
      {isExpanded && (
        <View
          style={[
            collapsibleStyles.content,
            { backgroundColor: themeColors.codeBackground },
          ]}
        >
          {children}
        </View>
      )}
    </View>
  );
};

const collapsibleStyles = {
  container: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  } as ViewStyle,
  headerExpanded: {
    borderBottomWidth: 1,
  } as ViewStyle,
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  } as ViewStyle,
  title: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  } as TextStyle,
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  } as ViewStyle,
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
  } as TextStyle,
  content: {
    padding: 12,
  } as ViewStyle,
};

const createThemedStyles = (themeColors: ThemeColors) => ({
  logItem: {
    backgroundColor: themeColors.surface,
    borderLeftWidth: 2,
    borderLeftColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: themeColors.borderSubtle,
  } as ViewStyle,
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  } as ViewStyle,
  urlPath: {
    fontSize: 12,
    color: themeColors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  } as TextStyle,
  urlDomain: {
    fontSize: 10,
    color: themeColors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  } as TextStyle,
  timestamp: {
    fontSize: 10,
    color: themeColors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  } as TextStyle,
  duration: {
    fontSize: 13,
    color: themeColors.text,
    fontWeight: '600',
  } as TextStyle,
  logDetails: {
    borderTopWidth: 1,
    borderTopColor: themeColors.borderSubtle,
    backgroundColor: themeColors.surfaceContainerLow,
  } as ViewStyle,
  fullUrlContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.borderSubtle,
  } as ViewStyle,
  fullUrl: {
    fontSize: 12,
    color: themeColors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 18,
  } as TextStyle,
  statusTextLabel: {
    fontSize: 13,
    color: themeColors.textMuted,
    fontWeight: '400',
  } as TextStyle,
  durationLarge: {
    fontSize: 12,
    color: themeColors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  } as TextStyle,
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: themeColors.border,
    backgroundColor: 'transparent',
  } as ViewStyle,
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: themeColors.text,
    letterSpacing: 0.3,
  } as TextStyle,
  codeBlock: {
    position: 'relative',
  } as ViewStyle,
  codeText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: themeColors.textSecondary,
    lineHeight: 16,
  } as TextStyle,
});

const staticStyles = {
  statusColumn: {
    width: 44,
  } as ViewStyle,
  statusCode: {
    fontSize: 13,
    fontWeight: '600',
  } as TextStyle,
  methodColumn: {
    width: 56,
  } as ViewStyle,
  methodBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  } as ViewStyle,
  methodText: {
    fontSize: 10,
    fontWeight: '700',
  } as TextStyle,
  urlColumn: {
    flex: 1,
    paddingHorizontal: 12,
  } as ViewStyle,
  durationColumn: {
    alignItems: 'flex-end',
  } as ViewStyle,
  urlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  } as ViewStyle,
  methodBadgeLarge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  } as ViewStyle,
  methodTextLarge: {
    fontSize: 11,
    fontWeight: '700',
  } as TextStyle,
  statusLarge: {
    fontSize: 14,
    fontWeight: '600',
  } as TextStyle,
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    flexWrap: 'wrap',
  } as ViewStyle,
  actionButtonDisabled: {
    opacity: 0.5,
  } as ViewStyle,
  deleteButton: {
    marginLeft: 'auto',
    borderColor: colors.error,
  } as ViewStyle,
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: `${colors.warning}15`,
  } as ViewStyle,
  warningText: {
    fontSize: 11,
    color: colors.warning,
    fontWeight: '500',
  } as TextStyle,
  detailsScroll: {
    maxHeight: 450,
    padding: 12,
  } as ViewStyle,
  copyButtonAbsolute: {
    position: 'absolute',
    right: 0,
    top: 0,
  } as ViewStyle,
  copyButtonInline: {
    marginTop: 12,
    alignSelf: 'flex-start',
  } as ViewStyle,
  jsonContainer: {
    position: 'relative',
  } as ViewStyle,
  copyButtonFloat: {
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 10,
  } as ViewStyle,
  errorBlock: {
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  } as ViewStyle,
  errorText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: colors.error,
    lineHeight: 16,
  } as TextStyle,
};

export default NetworkLogItem;
export type { NetworkLogItemProps };
