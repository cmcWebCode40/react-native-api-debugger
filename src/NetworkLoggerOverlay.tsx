import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ListRenderItem,
} from 'react-native';

import NetworkLogItem from './NetworkLogItem';
import RNShake from 'react-native-shake';
import type { NetworkLog, NetworkLogger } from './types';
import Icon from './Icon';

interface NetworkLoggerOverlayProps {
  networkLogger: NetworkLogger;
  enableDeviceShake?: boolean;
}

export const NetworkLoggerOverlay: React.FC<NetworkLoggerOverlayProps> = ({
  networkLogger,
  enableDeviceShake,
}) => {
  const [visible, setVisible] = useState<boolean>(false);
  const [logs, setLogs] = useState<NetworkLog[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [apiFilterActive, setApiFilterActive] = useState<boolean>(false);
  const [showButton, setShowButton] = useState<boolean>(
    enableDeviceShake ? false : true
  );

  useEffect(() => {
    const unsubscribe = networkLogger.subscribe(setLogs);

    if (!enableDeviceShake) {
      return;
    }
    const subscription = RNShake.addListener(() => {
      setShowButton(true);
    });
    return () => {
      unsubscribe();
      subscription?.remove();
    };
  }, [networkLogger, enableDeviceShake]);

  const handleCloseIcon = () => {
    setShowButton(false);
  };
  const filteredLogs: NetworkLog[] = logs.filter((log: NetworkLog) => {
    const matchesSearch: boolean =
      log.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.method.toLowerCase().includes(searchTerm.toLowerCase());

    if (apiFilterActive) {
      const hasApi: boolean = log.url.toLowerCase().includes('api');
      return matchesSearch && hasApi;
    }

    return matchesSearch;
  });

  const handleClearLogs = (): void => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to clear all network logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', onPress: () => networkLogger.clearLogs() },
      ]
    );
  };

  const handleModalOpen = (): void => {
    setVisible(true);
  };

  const handleModalClose = (): void => {
    setVisible(false);
  };

  const handleSearchChange = (text: string): void => {
    setSearchTerm(text);
  };

  const toggleApiFilter = (): void => {
    setApiFilterActive(!apiFilterActive);
  };

  const renderLogItem: ListRenderItem<NetworkLog> = ({ item }) => (
    <NetworkLogItem log={item} />
  );

  const renderEmptyList = (): React.ReactElement => (
    <Text style={styles.emptyText}>No network requests logged yet</Text>
  );

  const keyExtractor = (item: NetworkLog): string => item.id.toString();

  return (
    <>
      {showButton && (
        <View>
          {enableDeviceShake && (
            <TouchableOpacity
              onPress={handleCloseIcon}
              style={[styles.floatingCloseIcon]}
            >
              <Icon type="close" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={handleModalOpen}
            activeOpacity={0.8}
          >
            <Text style={styles.floatingButtonText}>📊 {logs.length}</Text>
          </TouchableOpacity>
        </View>
      )}
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleModalClose}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Network Logs</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearLogs}
                activeOpacity={0.8}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleModalClose}
                activeOpacity={0.8}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by URL or method..."
              value={searchTerm}
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={'gray'}
              clearButtonMode="while-editing"
              onChangeText={handleSearchChange}
            />
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[
                  styles.apiFilterTag,
                  apiFilterActive && styles.apiFilterTagActive,
                ]}
                onPress={toggleApiFilter}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.apiFilterText,
                    apiFilterActive && styles.apiFilterTextActive,
                  ]}
                >
                  API
                </Text>
              </TouchableOpacity>
              <View />
            </View>
          </View>
          <FlatList
            data={filteredLogs}
            keyExtractor={keyExtractor}
            renderItem={renderLogItem}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={renderEmptyList}
            showsVerticalScrollIndicator={true}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={10}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 25,
    elevation: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1000,
  },
  floatingCloseIcon: {
    position: 'absolute',
    bottom: 150,
    right: 16,
    padding: 16,
    borderRadius: 25,
    zIndex: 1000,
  },
  floatingButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  clearButton: {
    backgroundColor: '#E14434',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  listContainer: {
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: '50%',
  },
  apiFilterTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 10,
  },
  apiFilterTagActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  apiFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  apiFilterTextActive: {
    color: '#fff',
  },
});
export type { NetworkLoggerOverlayProps, NetworkLogger };
