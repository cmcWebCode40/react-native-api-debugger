import React, { useState, useMemo, useCallback } from 'react';
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  Platform,
  type ViewStyle,
  type TextStyle,
  type ListRenderItem,
} from 'react-native';
import type { WebSocketLog, WebSocketMessage } from '../../types';
import type { ThemeMode, ThemeColors } from '../../constants/colors';
import {
  colors,
  getThemeColors,
  getWebSocketStateColor,
  getWebSocketMessageColor,
} from '../../constants/colors';
import { CopyItem, JsonViewer } from '../../components/common';
import { SvgIcon } from '../../icons';

interface WebSocketLogItemProps {
  log: WebSocketLog;
  useCopyToClipboard?: boolean;
  theme?: ThemeMode;
  onDelete?: (logId: number) => void;
  onClose?: (logId: number) => void;
  isAlternate?: boolean;
}

type MessageFilter = 'all' | 'sent' | 'received';

const WebSocketLogItem: React.FC<WebSocketLogItemProps> = ({
  log,
  useCopyToClipboard,
  theme = 'dark',
  onDelete,
  onClose,
  isAlternate = false,
}) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [messageFilter, setMessageFilter] = useState<MessageFilter>('all');
  const [expandedMessageId, setExpandedMessageId] = useState<number | null>(
    null
  );

  const themeColors = useMemo(() => getThemeColors(theme), [theme]);
  const themedStyles = useMemo(
    () => createThemedStyles(themeColors),
    [themeColors]
  );

  const stateColor = getWebSocketStateColor(log.state);
  const isActive = log.state === 'open' || log.state === 'connecting';

  const filteredMessages = useMemo(() => {
    if (messageFilter === 'all') return log.messages;
    return log.messages.filter((m) => m.direction === messageFilter);
  }, [log.messages, messageFilter]);

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const formatDuration = (startTime: string, endTime?: string): string => {
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    const duration = end - start;

    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getUrlPath = (): string => {
    try {
      const url = new URL(log.url);
      return url.pathname;
    } catch {
      return log.url;
    }
  };

  const getUrlHost = (): string => {
    try {
      const url = new URL(log.url);
      return url.hostname;
    } catch {
      return '';
    }
  };

  const handleHeaderPress = useCallback(() => {
    setExpanded(!expanded);
  }, [expanded]);

  const handleDelete = useCallback(() => {
    onDelete?.(log.id);
  }, [log.id, onDelete]);

  const handleCloseConnection = useCallback(() => {
    onClose?.(log.id);
  }, [log.id, onClose]);

  const rowBackgroundColor = isAlternate
    ? themeColors.surfaceContainerLow
    : themeColors.surface;

  const borderColor = expanded ? stateColor : 'transparent';

  const renderMessageItem: ListRenderItem<WebSocketMessage> = useCallback(
    ({ item: message }) => {
      const messageColor = getWebSocketMessageColor(message.direction);
      const isExpanded = expandedMessageId === message.id;
      const isJson =
        message.data.trim().startsWith('{') ||
        message.data.trim().startsWith('[');

      return (
        <TouchableOpacity
          style={[
            themedStyles.messageItem,
            message.direction === 'sent'
              ? themedStyles.messageSent
              : themedStyles.messageReceived,
          ]}
          onPress={() => setExpandedMessageId(isExpanded ? null : message.id)}
          activeOpacity={0.7}
        >
          <View style={staticStyles.messageHeader}>
            <View style={staticStyles.messageDirection}>
              <SvgIcon
                name={
                  message.direction === 'sent' ? 'chevronUp' : 'chevronDown'
                }
                size={12}
                color={messageColor}
              />
              <Text
                style={[
                  staticStyles.messageTime,
                  { color: themeColors.textMuted },
                ]}
              >
                {formatTime(message.timestamp)}
              </Text>
            </View>
            <Text
              style={[
                staticStyles.messageSize,
                { color: themeColors.textMuted },
              ]}
            >
              {formatBytes(message.size)}
            </Text>
          </View>

          {isExpanded && isJson ? (
            <View style={themedStyles.messageContent}>
              <JsonViewer
                data={message.data}
                theme={theme}
                maxInitialDepth={3}
              />
              <View style={staticStyles.copyButtonFloat}>
                <CopyItem
                  useCopyToClipboard={useCopyToClipboard}
                  textToCopy={message.data}
                />
              </View>
            </View>
          ) : (
            <Text
              style={[themedStyles.messageData, { color: themeColors.text }]}
              numberOfLines={isExpanded ? undefined : 2}
            >
              {message.data}
            </Text>
          )}
        </TouchableOpacity>
      );
    },
    [expandedMessageId, theme, themeColors, themedStyles, useCopyToClipboard]
  );

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
        {/* State indicator */}
        <View style={staticStyles.stateColumn}>
          <View
            style={[
              staticStyles.stateIndicator,
              { backgroundColor: stateColor },
              isActive && staticStyles.stateActive,
            ]}
          />
        </View>

        {/* WS Badge */}
        <View style={staticStyles.typeColumn}>
          <View
            style={[
              staticStyles.typeBadge,
              { backgroundColor: `${colors.websocket.open}15` },
            ]}
          >
            <Text
              style={[staticStyles.typeText, { color: colors.websocket.open }]}
            >
              WS
            </Text>
          </View>
        </View>

        {/* URL */}
        <View style={staticStyles.urlColumn}>
          <Text style={themedStyles.urlPath} numberOfLines={1}>
            {getUrlPath()}
          </Text>
          <Text style={themedStyles.urlHost} numberOfLines={1}>
            {getUrlHost()}
          </Text>
        </View>

        {/* Messages count & data */}
        <View style={staticStyles.statsColumn}>
          <View style={staticStyles.messageStats}>
            <SvgIcon name="chevronUp" size={10} color={colors.websocket.sent} />
            <Text style={themedStyles.statText}>{log.messageCount.sent}</Text>
            <SvgIcon
              name="chevronDown"
              size={10}
              color={colors.websocket.received}
            />
            <Text style={themedStyles.statText}>
              {log.messageCount.received}
            </Text>
          </View>
          <Text style={themedStyles.dataSize}>
            {formatBytes(log.bytesSent + log.bytesReceived)}
          </Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={themedStyles.logDetails}>
          {/* Connection Info */}
          <View style={themedStyles.infoSection}>
            <View style={staticStyles.infoRow}>
              <Text style={themedStyles.infoLabel}>URL</Text>
              <Text style={themedStyles.infoValue} numberOfLines={2}>
                {log.url}
              </Text>
            </View>
            <View style={staticStyles.infoGrid}>
              <View style={staticStyles.infoCell}>
                <Text style={themedStyles.infoLabel}>State</Text>
                <Text style={[themedStyles.infoValue, { color: stateColor }]}>
                  {log.state.toUpperCase()}
                </Text>
              </View>
              <View style={staticStyles.infoCell}>
                <Text style={themedStyles.infoLabel}>Duration</Text>
                <Text style={themedStyles.infoValue}>
                  {formatDuration(log.connectTime, log.closeTime)}
                </Text>
              </View>
              {log.handshakeDuration !== undefined && (
                <View style={staticStyles.infoCell}>
                  <Text style={themedStyles.infoLabel}>Handshake</Text>
                  <Text style={themedStyles.infoValue}>
                    {log.handshakeDuration}ms
                  </Text>
                </View>
              )}
              {log.closeCode !== undefined && (
                <View style={staticStyles.infoCell}>
                  <Text style={themedStyles.infoLabel}>Close Code</Text>
                  <Text style={themedStyles.infoValue}>
                    {log.closeCode} {log.closeReason && `(${log.closeReason})`}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={staticStyles.actionBar}>
            {isActive && onClose && (
              <TouchableOpacity
                style={[
                  themedStyles.actionButton,
                  { borderColor: colors.warning },
                ]}
                onPress={handleCloseConnection}
                activeOpacity={0.7}
              >
                <SvgIcon name="x" size={14} color={colors.warning} />
                <Text
                  style={[
                    themedStyles.actionButtonText,
                    { color: colors.warning },
                  ]}
                >
                  CLOSE
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={themedStyles.actionButton}
              activeOpacity={0.7}
            >
              <CopyItem
                useCopyToClipboard={useCopyToClipboard}
                textToCopy={JSON.stringify(log, null, 2)}
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

          {log.error && (
            <View style={staticStyles.errorBanner}>
              <SvgIcon name="alertCircle" size={14} color={colors.error} />
              <Text style={staticStyles.errorText}>{log.error}</Text>
            </View>
          )}

          {/* Messages Section */}
          <View style={themedStyles.messagesSection}>
            <View style={themedStyles.messagesHeader}>
              <Text style={themedStyles.messagesTitle}>
                MESSAGES ({log.messages.length})
              </Text>
              <View style={staticStyles.filterButtons}>
                {(['all', 'sent', 'received'] as MessageFilter[]).map(
                  (filter) => (
                    <TouchableOpacity
                      key={filter}
                      style={[
                        themedStyles.filterButton,
                        messageFilter === filter &&
                          themedStyles.filterButtonActive,
                      ]}
                      onPress={() => setMessageFilter(filter)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          themedStyles.filterButtonText,
                          messageFilter === filter &&
                            staticStyles.filterButtonTextActive,
                        ]}
                      >
                        {filter === 'all'
                          ? 'All'
                          : filter === 'sent'
                            ? `↑ ${log.messageCount.sent}`
                            : `↓ ${log.messageCount.received}`}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>

            {filteredMessages.length > 0 ? (
              <FlatList
                data={filteredMessages}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderMessageItem}
                style={staticStyles.messagesList}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              />
            ) : (
              <View style={themedStyles.emptyMessages}>
                <Text style={themedStyles.emptyMessagesText}>
                  No messages{' '}
                  {messageFilter !== 'all' ? `(${messageFilter})` : ''}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
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
  urlHost: {
    fontSize: 10,
    color: themeColors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  } as TextStyle,
  statText: {
    fontSize: 11,
    color: themeColors.text,
    fontWeight: '600',
    marginLeft: 2,
    marginRight: 6,
  } as TextStyle,
  dataSize: {
    fontSize: 10,
    color: themeColors.textMuted,
    marginTop: 2,
  } as TextStyle,
  logDetails: {
    borderTopWidth: 1,
    borderTopColor: themeColors.borderSubtle,
    backgroundColor: themeColors.surfaceContainerLow,
  } as ViewStyle,
  infoSection: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.borderSubtle,
  } as ViewStyle,
  infoLabel: {
    fontSize: 10,
    color: themeColors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  } as TextStyle,
  infoValue: {
    fontSize: 12,
    color: themeColors.text,
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
  messagesSection: {
    padding: 12,
  } as ViewStyle,
  messagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  } as ViewStyle,
  messagesTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: themeColors.textMuted,
    letterSpacing: 0.5,
  } as TextStyle,
  filterButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: themeColors.border,
    marginLeft: 4,
  } as ViewStyle,
  filterButtonActive: {
    backgroundColor: themeColors.primaryContainer,
    borderColor: themeColors.primaryContainer,
  } as ViewStyle,
  filterButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: themeColors.textMuted,
  } as TextStyle,
  messageItem: {
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: themeColors.border,
    backgroundColor: themeColors.surfaceContainer,
  } as ViewStyle,
  messageSent: {
    borderLeftWidth: 2,
    borderLeftColor: colors.websocket.sent,
  } as ViewStyle,
  messageReceived: {
    borderLeftWidth: 2,
    borderLeftColor: colors.websocket.received,
  } as ViewStyle,
  messageContent: {
    position: 'relative',
    marginTop: 8,
  } as ViewStyle,
  messageData: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 16,
    marginTop: 6,
  } as TextStyle,
  emptyMessages: {
    padding: 20,
    alignItems: 'center',
  } as ViewStyle,
  emptyMessagesText: {
    fontSize: 12,
    color: themeColors.textMuted,
  } as TextStyle,
});

const staticStyles = {
  stateColumn: {
    width: 24,
  } as ViewStyle,
  stateIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  } as ViewStyle,
  stateActive: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  } as ViewStyle,
  typeColumn: {
    width: 40,
  } as ViewStyle,
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  } as ViewStyle,
  typeText: {
    fontSize: 10,
    fontWeight: '700',
  } as TextStyle,
  urlColumn: {
    flex: 1,
    paddingHorizontal: 8,
  } as ViewStyle,
  statsColumn: {
    alignItems: 'flex-end',
  } as ViewStyle,
  messageStats: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  infoRow: {
    marginBottom: 12,
  } as ViewStyle,
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  } as ViewStyle,
  infoCell: {
    minWidth: 80,
  } as ViewStyle,
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  } as ViewStyle,
  deleteButton: {
    marginLeft: 'auto',
    borderColor: colors.error,
  } as ViewStyle,
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: `${colors.error}15`,
  } as ViewStyle,
  errorText: {
    fontSize: 11,
    color: colors.error,
    fontWeight: '500',
  } as TextStyle,
  filterButtons: {
    flexDirection: 'row',
  } as ViewStyle,
  filterButtonTextActive: {
    color: '#FFFFFF',
  } as TextStyle,
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  messageDirection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  messageTime: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  } as TextStyle,
  messageSize: {
    fontSize: 10,
  } as TextStyle,
  messagesList: {
    maxHeight: 300,
  } as ViewStyle,
  copyButtonFloat: {
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 10,
  } as ViewStyle,
};

export default WebSocketLogItem;
export type { WebSocketLogItemProps };
