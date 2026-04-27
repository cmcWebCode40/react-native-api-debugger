import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ListRenderItem,
  type ViewStyle,
  type TextStyle,
} from 'react-native';

import NetworkLogItem from './NetworkLogItem';
import type { NetworkLog, NetworkLogger } from './types';
import type { StatusFilterKey } from './utils/filters';
import FloatingButton from './FloatingButton';
import NonFloatingButton from './NonFloatingButton';
import {
  colors,
  getThemeColors,
  type ThemeMode,
  type ThemeColors,
} from './constants/colors';
import { filterLogs, getLogStats, defaultFilterState } from './utils/filters';
import type { FilterState } from './utils/filters';
import { ExportModal } from './components/ExportModal';
import { SvgIcon } from './SvgIcon';

let RNShake: any = null;

try {
  RNShake = require('react-native-shake').default;
} catch (error) {
  RNShake = null;
}

interface NetworkLoggerOverlayProps {
  networkLogger: NetworkLogger;
  enabled?: boolean;
  enableDeviceShake?: boolean;
  showRequestHeader?: boolean;
  showResponseHeader?: boolean;
  draggable?: boolean;
  useCopyToClipboard?: boolean;
  theme?: ThemeMode;
  onThemeChange?: (theme: ThemeMode) => void;
}

const STATUS_FILTERS: { key: StatusFilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'success', label: '2xx' },
  { key: 'redirect', label: '3xx' },
  { key: 'clientError', label: '4xx' },
  { key: 'serverError', label: '5xx' },
];

export const NetworkLoggerOverlay: React.FC<NetworkLoggerOverlayProps> = ({
  draggable,
  networkLogger,
  enabled = __DEV__,
  enableDeviceShake,
  showRequestHeader,
  showResponseHeader,
  useCopyToClipboard,
  theme: themeProp,
  onThemeChange,
}) => {
  const [visible, setVisible] = useState<boolean>(false);
  const [logs, setLogs] = useState<NetworkLog[]>([]);
  const [filters, setFilters] = useState<FilterState>(defaultFilterState);
  const [showButton, setShowButton] = useState<boolean>(!enableDeviceShake);
  const [internalTheme, setInternalTheme] = useState<ThemeMode>(
    themeProp ?? 'dark'
  );
  const [exportModalVisible, setExportModalVisible] = useState<boolean>(false);

  const theme = themeProp ?? internalTheme;
  const themeColors = useMemo(() => getThemeColors(theme), [theme]);

  const toggleTheme = useCallback(() => {
    const newTheme = internalTheme === 'light' ? 'dark' : 'light';
    setInternalTheme(newTheme);
    onThemeChange?.(newTheme);
  }, [internalTheme, onThemeChange]);

  const themedStyles = useMemo(
    () => createThemedStyles(themeColors),
    [themeColors]
  );

  useEffect(() => {
    if (enabled && !__DEV__) {
      console.warn(
        '[NetworkLoggerOverlay] Warning: Network logger is enabled in production mode. ' +
          'This may expose sensitive data. Set enabled={false} or remove the prop to disable in production.'
      );
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = networkLogger.subscribe(setLogs);

    if (enableDeviceShake && !RNShake) {
      throw new Error(
        'react-native-shake is required to enableDeviceShake but module is not installed. Please install it with: npm install react-native-shake'
      );
    }

    if (!enableDeviceShake) {
      return () => {
        unsubscribe();
      };
    }
    const subscription = RNShake.addListener(() => {
      setShowButton(true);
    });
    return () => {
      unsubscribe();
      subscription?.remove();
    };
  }, [networkLogger, enableDeviceShake, enabled]);

  const handleCloseIcon = useCallback(() => {
    setShowButton(false);
  }, []);

  const filteredLogs = useMemo(
    () => filterLogs(logs, filters),
    [logs, filters]
  );

  const logStats = useMemo(() => getLogStats(logs), [logs]);

  const updateFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters(defaultFilterState);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchTerm !== '' ||
      filters.statusFilter !== 'all' ||
      filters.methodFilter !== null
    );
  }, [filters]);

  const handleClearLogs = useCallback((): void => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to clear all network logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', onPress: () => networkLogger.clearLogs() },
      ]
    );
  }, [networkLogger]);

  const handleDeleteLog = useCallback(
    (logId: number): void => {
      networkLogger.deleteLog(logId);
    },
    [networkLogger]
  );

  const handleModalOpen = useCallback((): void => {
    setVisible(true);
  }, []);

  const handleModalClose = useCallback((): void => {
    setVisible(false);
  }, []);

  const handleSearchChange = useCallback(
    (text: string): void => {
      updateFilter('searchTerm', text);
    },
    [updateFilter]
  );

  const handleStatusFilterChange = useCallback(
    (key: StatusFilterKey): void => {
      updateFilter('statusFilter', key);
    },
    [updateFilter]
  );

  const renderLogItem: ListRenderItem<NetworkLog> = ({ item, index }) => (
    <NetworkLogItem
      log={item}
      useCopyToClipboard={useCopyToClipboard}
      showResponseHeader={showResponseHeader}
      showRequestHeader={showRequestHeader}
      theme={theme}
      onDelete={handleDeleteLog}
      onCloseModal={handleModalClose}
      isAlternate={index % 2 === 1}
    />
  );

  const renderEmptyList = (): React.ReactElement => (
    <View style={themedStyles.emptyContainer}>
      <View style={themedStyles.emptyIconContainer}>
        <SvgIcon name="cloudOff" size={40} color={themeColors.border} />
      </View>
      <Text style={themedStyles.emptyTitle}>Listening for traffic...</Text>
      <Text style={themedStyles.emptyText}>
        No network requests logged yet. Trigger an API call in your app to see
        it here.
      </Text>
      <View style={themedStyles.statusPill}>
        <View style={staticStyles.statusDot} />
        <Text style={themedStyles.statusPillText}>Interceptor Active</Text>
      </View>
    </View>
  );

  const keyExtractor = (item: NetworkLog): string => item.id.toString();

  const buttonProps = {
    draggable,
    enableDeviceShake,
    hideIcon: handleCloseIcon,
    openModal: handleModalOpen,
    logsLength: logs.length,
    errorCount: logStats.errors,
    theme,
  };

  if (!enabled) {
    return null;
  }

  return (
    <>
      {showButton &&
        (draggable ? (
          <FloatingButton {...buttonProps} />
        ) : (
          <NonFloatingButton {...buttonProps} />
        ))}
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleModalClose}
      >
        <View style={themedStyles.modalContainer}>
          <StatusBar
            barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
            backgroundColor={themeColors.surfaceContainer}
          />
          {/* Header */}
          <View style={themedStyles.header}>
            <View style={staticStyles.headerLeft}>
              <SvgIcon
                name="terminal"
                size={20}
                color={themeColors.primaryContainer}
              />
              <Text style={themedStyles.title}>NETWORK LOGS</Text>
            </View>
            <View style={staticStyles.headerRight}>
              <TouchableOpacity
                style={staticStyles.iconButton}
                onPress={toggleTheme}
                activeOpacity={0.7}
              >
                <SvgIcon
                  name={theme === 'dark' ? 'sun' : 'moon'}
                  size={20}
                  color={themeColors.textMuted}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={staticStyles.iconButton}
                onPress={() => {
                  setVisible(false);
                  setExportModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <SvgIcon
                  name="download"
                  size={20}
                  color={themeColors.textMuted}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[staticStyles.iconButton]}
                onPress={handleClearLogs}
                activeOpacity={0.7}
              >
                <SvgIcon name="trash" size={20} color={themeColors.danger} />
              </TouchableOpacity>
              <TouchableOpacity
                style={staticStyles.iconButton}
                onPress={handleModalClose}
                activeOpacity={0.7}
              >
                <SvgIcon name="x" size={20} color={themeColors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search & Filters */}
          <View style={themedStyles.searchContainer}>
            <View style={themedStyles.searchInputContainer}>
              <SvgIcon name="search" size={18} color={themeColors.textMuted} />
              <TextInput
                style={themedStyles.searchInput}
                placeholder="Filter by URL, method, status..."
                value={filters.searchTerm}
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={themeColors.textMuted}
                onChangeText={handleSearchChange}
              />
            </View>
            <View style={staticStyles.filterRow}>
              <View style={staticStyles.filterChips}>
                {STATUS_FILTERS.map((filter) => (
                  <TouchableOpacity
                    key={filter.key}
                    style={[
                      themedStyles.filterChip,
                      filters.statusFilter === filter.key &&
                        themedStyles.filterChipActive,
                    ]}
                    onPress={() => handleStatusFilterChange(filter.key)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        themedStyles.filterChipText,
                        filters.statusFilter === filter.key &&
                          staticStyles.filterChipTextActive,
                      ]}
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {hasActiveFilters && (
                <TouchableOpacity onPress={clearFilters} activeOpacity={0.7}>
                  <Text style={themedStyles.clearFiltersText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Stats Bar */}
          {logs.length > 0 && (
            <View style={themedStyles.statsBar}>
              <Text style={themedStyles.statsText}>
                {filteredLogs.length} of {logs.length} requests
              </Text>
              {logStats.errors > 0 && (
                <Text style={staticStyles.errorStats}>
                  {logStats.errors} errors
                </Text>
              )}
            </View>
          )}

          {/* Log List */}
          <FlatList
            data={filteredLogs}
            keyExtractor={keyExtractor}
            renderItem={renderLogItem}
            contentContainerStyle={
              logs.length === 0
                ? staticStyles.emptyListContainer
                : staticStyles.listContainer
            }
            ListEmptyComponent={renderEmptyList}
            showsVerticalScrollIndicator={true}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={10}
          />
        </View>
      </Modal>
      <ExportModal
        visible={exportModalVisible}
        onClose={() => setExportModalVisible(false)}
        logs={filteredLogs}
        theme={theme}
      />
    </>
  );
};

const createThemedStyles = (themeColors: ThemeColors) => ({
  modalContainer: {
    flex: 1,
    backgroundColor: themeColors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 44,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: themeColors.surfaceContainer,
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
  searchContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: themeColors.surfaceContainer,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
    gap: 10,
  } as ViewStyle,
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: themeColors.border,
    paddingHorizontal: 12,
    gap: 8,
  } as ViewStyle,
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 12,
    color: themeColors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  } as TextStyle,
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: themeColors.border,
    backgroundColor: 'transparent',
  } as ViewStyle,
  filterChipActive: {
    backgroundColor: themeColors.primaryContainer,
    borderColor: themeColors.primaryContainer,
  } as ViewStyle,
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: themeColors.textMuted,
    letterSpacing: 0.5,
  } as TextStyle,
  clearFiltersText: {
    fontSize: 11,
    color: themeColors.primary,
    fontWeight: '600',
  } as TextStyle,
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: themeColors.surfaceContainerLow,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.borderSubtle,
  } as ViewStyle,
  statsText: {
    fontSize: 11,
    color: themeColors.textMuted,
    fontWeight: '500',
  } as TextStyle,
  emptyContainer: {
    // flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: '25%',
  } as ViewStyle,
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: themeColors.border,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: themeColors.surfaceContainerLow,
  } as ViewStyle,
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: themeColors.text,
    marginBottom: 8,
  } as TextStyle,
  emptyText: {
    textAlign: 'center',
    color: themeColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  } as TextStyle,
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.surfaceContainer,
    borderWidth: 1,
    borderColor: themeColors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  } as ViewStyle,
  statusPillText: {
    fontSize: 12,
    color: themeColors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  } as TextStyle,
});

const staticStyles = {
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  } as ViewStyle,
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  iconButton: {
    padding: 8,
  } as ViewStyle,
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  filterChips: {
    flexDirection: 'row',
    gap: 6,
  } as ViewStyle,
  filterChipTextActive: {
    color: '#FFFFFF',
  } as TextStyle,
  errorStats: {
    fontSize: 11,
    color: colors.error,
    fontWeight: '600',
  } as TextStyle,
  listContainer: {
    paddingBottom: 34,
  } as ViewStyle,
  emptyListContainer: {
    flexGrow: 1,
  } as ViewStyle,
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  } as ViewStyle,
};

export type { NetworkLoggerOverlayProps, NetworkLogger };
