import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
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
import { colors, getThemeColors, type ThemeMode } from './constants/colors';
import { filterLogs, getLogStats, defaultFilterState } from './utils/filters';
import type { FilterState } from './utils/filters';
import { ExportModal } from './components/ExportModal';

let RNShake: any = null;

try {
  RNShake = require('react-native-shake').default;
} catch (error) {
  RNShake = null;
}

interface NetworkLoggerOverlayProps {
  networkLogger: NetworkLogger;
  /**
   * Controls whether the overlay is enabled. Defaults to __DEV__ (development mode only).
   * Set to true to force enable in production (not recommended).
   * Set to false to disable even in development.
   */
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
  { key: 'error', label: 'Errors' },
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
    themeProp ?? 'light'
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
      filters.methodFilter !== null ||
      filters.apiOnly
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

  const toggleApiFilter = useCallback((): void => {
    updateFilter('apiOnly', !filters.apiOnly);
  }, [filters.apiOnly, updateFilter]);

  const handleStatusFilterChange = useCallback(
    (key: StatusFilterKey): void => {
      updateFilter('statusFilter', key);
    },
    [updateFilter]
  );

  const renderLogItem: ListRenderItem<NetworkLog> = ({ item }) => (
    <NetworkLogItem
      log={item}
      useCopyToClipboard={useCopyToClipboard}
      showResponseHeader={showResponseHeader}
      showRequestHeader={showRequestHeader}
      theme={theme}
      onDelete={handleDeleteLog}
      onCloseModal={handleModalClose}
    />
  );

  const renderEmptyList = (): React.ReactElement => (
    <Text style={themedStyles.emptyText}>No network requests logged yet</Text>
  );

  const keyExtractor = (item: NetworkLog): string => item.id.toString();

  const buttonProps = {
    draggable,
    enableDeviceShake,
    hideIcon: handleCloseIcon,
    openModal: handleModalOpen,
    logsLength: logs.length,
    errorCount: logStats.errors,
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
        <SafeAreaView style={themedStyles.modalContainer}>
          <View style={themedStyles.header}>
            <Text style={themedStyles.title}>Network Logs</Text>
            <View style={staticStyles.headerButtons}>
              <TouchableOpacity
                style={staticStyles.themeButton}
                onPress={toggleTheme}
                activeOpacity={0.8}
              >
                <Text style={staticStyles.themeButtonText}>
                  {theme === 'light' ? '🌙' : '☀️'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={staticStyles.exportButton}
                onPress={() => {
                  setVisible(false);
                  setExportModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Text style={staticStyles.themeButtonText}>📤</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={themedStyles.clearButton}
                onPress={handleClearLogs}
                activeOpacity={0.8}
              >
                <Text style={staticStyles.buttonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={themedStyles.closeButton}
                onPress={handleModalClose}
                activeOpacity={0.8}
              >
                <Text style={staticStyles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={themedStyles.searchContainer}>
            <TextInput
              style={themedStyles.searchInput}
              placeholder="Search by URL, method, or body..."
              value={filters.searchTerm}
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={themeColors.textMuted}
              clearButtonMode="while-editing"
              onChangeText={handleSearchChange}
            />
            <View style={staticStyles.statsContainer}>
              <Text style={themedStyles.statsText}>
                {filteredLogs.length}/{logs.length} requests
                {logStats.errors > 0 && (
                  <Text style={staticStyles.errorStats}>
                    {' '}
                    ({logStats.errors} errors)
                  </Text>
                )}
              </Text>
              {hasActiveFilters && (
                <TouchableOpacity onPress={clearFilters} activeOpacity={0.7}>
                  <Text style={themedStyles.clearFiltersText}>
                    Clear filters
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={staticStyles.filterContainer}>
              {STATUS_FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    themedStyles.filterTag,
                    filters.statusFilter === filter.key &&
                      themedStyles.filterTagActive,
                    filter.key === 'error' &&
                      filters.statusFilter === filter.key &&
                      staticStyles.filterTagError,
                  ]}
                  onPress={() => handleStatusFilterChange(filter.key)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      themedStyles.filterTagText,
                      filters.statusFilter === filter.key &&
                        staticStyles.filterTagTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  themedStyles.filterTag,
                  filters.apiOnly && themedStyles.filterTagActive,
                ]}
                onPress={toggleApiFilter}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    themedStyles.filterTagText,
                    filters.apiOnly && staticStyles.filterTagTextActive,
                  ]}
                >
                  API
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <FlatList
            data={filteredLogs}
            keyExtractor={keyExtractor}
            renderItem={renderLogItem}
            contentContainerStyle={staticStyles.listContainer}
            ListEmptyComponent={renderEmptyList}
            showsVerticalScrollIndicator={true}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={10}
          />
        </SafeAreaView>
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

interface ThemeColors {
  background: string;
  surface: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  danger: string;
}

const createThemedStyles = (themeColors: ThemeColors) => ({
  modalContainer: {
    flex: 1,
    backgroundColor: themeColors.background,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: themeColors.surface,
    elevation: 2,
  } as ViewStyle,
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: themeColors.text,
  } as TextStyle,
  clearButton: {
    backgroundColor: themeColors.danger,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  } as ViewStyle,
  closeButton: {
    backgroundColor: themeColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  } as ViewStyle,
  searchContainer: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: themeColors.surface,
  } as ViewStyle,
  searchInput: {
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: themeColors.text,
    backgroundColor: themeColors.background,
  } as TextStyle,
  statsText: {
    fontSize: 12,
    color: themeColors.textSecondary,
  } as TextStyle,
  clearFiltersText: {
    fontSize: 12,
    color: themeColors.primary,
    fontWeight: '600',
  } as TextStyle,
  filterTag: {
    backgroundColor: themeColors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: themeColors.border,
  } as ViewStyle,
  filterTagActive: {
    backgroundColor: themeColors.primary,
    borderColor: themeColors.primary,
  } as ViewStyle,
  filterTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: themeColors.textSecondary,
  } as TextStyle,
  emptyText: {
    textAlign: 'center',
    color: themeColors.textSecondary,
    fontSize: 16,
    marginTop: '50%',
  } as TextStyle,
});

const staticStyles = {
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  themeButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 4,
  } as ViewStyle,
  exportButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  } as ViewStyle,
  themeButtonText: {
    fontSize: 18,
  } as TextStyle,
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  } as TextStyle,
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  } as ViewStyle,
  errorStats: {
    color: colors.error,
    fontWeight: '600',
  } as TextStyle,
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  } as ViewStyle,
  filterTagError: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  } as ViewStyle,
  filterTagTextActive: {
    color: '#fff',
  } as TextStyle,
  listContainer: {
    padding: 16,
  } as ViewStyle,
};
export type { NetworkLoggerOverlayProps, NetworkLogger };
