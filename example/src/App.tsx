import React, { useEffect, useState } from 'react';
import { StyleSheet, SafeAreaView, View } from 'react-native';
import { networkLogger, NetworkLoggerOverlay } from 'react-native-api-debugger';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NetworkScreen } from './screens/NetworkScreen';
import { WebSocketScreen } from './screens/WebSocketScreen';
import { BottomTabs, type Tab } from './components/BottomTabs';

const TABS: Tab[] = [
  { key: 'network', label: 'Network', icon: 'H' },
  { key: 'websocket', label: 'WebSocket', icon: 'WS' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('network');
  const [showHeaders, setShowHeaders] = useState<boolean>(false);

  useEffect(() => {
    networkLogger.configure({
      maxLogs: 50,
      ignoredUrls: ['/health', '/ping'],
      ignoredDomains: ['analytics.example.com'],
      slowRequestThreshold: 2000,
    });
    networkLogger.setupInterceptor();
  }, []);

  const renderScreen = () => {
    switch (activeTab) {
      case 'websocket':
        return <WebSocketScreen />;
      case 'network':
      default:
        return (
          <NetworkScreen
            showHeaders={showHeaders}
            setShowHeaders={setShowHeaders}
          />
        );
    }
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>{renderScreen()}</View>
        <BottomTabs
          tabs={TABS}
          activeTab={activeTab}
          onTabPress={setActiveTab}
        />
        <NetworkLoggerOverlay
          draggable={true}
          enableDeviceShake={false}
          useCopyToClipboard={true}
          showRequestHeader={showHeaders}
          showResponseHeader={showHeaders}
          networkLogger={networkLogger}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: '5%',
  },
  content: {
    flex: 1,
  },
});

export default App;
