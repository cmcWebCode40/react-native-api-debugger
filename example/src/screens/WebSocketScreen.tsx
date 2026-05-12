import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
} from 'react-native';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface WebSocketMessage {
  id: string;
  type: 'sent' | 'received';
  data: string;
  timestamp: Date;
}

interface ButtonComponentProps {
  title: string;
  onPress: () => void;
  color?: string;
  loading?: boolean;
  disabled?: boolean;
}

const ButtonComponent: React.FC<ButtonComponentProps> = ({
  title,
  onPress,
  color = '#007AFF',
  loading = false,
  disabled = false,
}) => (
  <TouchableOpacity
    style={[
      styles.button,
      { backgroundColor: color },
      disabled && styles.buttonDisabled,
    ]}
    onPress={onPress}
    disabled={loading || disabled}
    activeOpacity={0.8}
  >
    {loading ? (
      <ActivityIndicator color="#fff" size="small" />
    ) : (
      <Text style={styles.buttonText}>{title}</Text>
    )}
  </TouchableOpacity>
);

const getStatusColor = (status: ConnectionStatus): string => {
  switch (status) {
    case 'connected':
      return '#4CAF50';
    case 'connecting':
      return '#FF9800';
    case 'error':
      return '#F44336';
    default:
      return '#9E9E9E';
  }
};

const getStatusText = (status: ConnectionStatus): string => {
  switch (status) {
    case 'connected':
      return 'Connected';
    case 'connecting':
      return 'Connecting...';
    case 'error':
      return 'Error';
    default:
      return 'Disconnected';
  }
};

export const WebSocketScreen: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [serverUrl, setServerUrl] = useState('wss://echo.websocket.org');
  const wsRef = useRef<WebSocket | null>(null);
  const messageIdRef = useRef(0);

  const addMessage = useCallback((type: 'sent' | 'received', data: string) => {
    const newMessage: WebSocketMessage = {
      id: `msg-${messageIdRef.current++}`,
      type,
      data,
      timestamp: new Date(),
    };
    setMessages((prev) => [newMessage, ...prev]);
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setStatus('connecting');

    try {
      const ws = new WebSocket(serverUrl);

      ws.onopen = () => {
        setStatus('connected');
        addMessage('received', '[System] Connection established');
      };

      ws.onmessage = (event) => {
        addMessage('received', event.data);
      };

      ws.onerror = () => {
        setStatus('error');
        addMessage('received', '[System] Connection error occurred');
      };

      ws.onclose = (event) => {
        setStatus('disconnected');
        addMessage(
          'received',
          `[System] Connection closed (code: ${event.code})`
        );
        wsRef.current = null;
      };

      wsRef.current = ws;
    } catch (error) {
      setStatus('error');
      addMessage(
        'received',
        `[System] Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }, [serverUrl, addMessage]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback(() => {
    if (!inputMessage.trim() || wsRef.current?.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(inputMessage);
    addMessage('sent', inputMessage);
    setInputMessage('');
  }, [inputMessage, addMessage]);

  const sendPing = useCallback(() => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      return;
    }

    const pingMessage = JSON.stringify({ type: 'ping', timestamp: Date.now() });
    wsRef.current.send(pingMessage);
    addMessage('sent', pingMessage);
  }, [addMessage]);

  const sendJsonMessage = useCallback(() => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      return;
    }

    const jsonMessage = JSON.stringify({
      action: 'subscribe',
      channel: 'updates',
      data: {
        userId: 123,
        preferences: ['notifications', 'alerts'],
      },
    });
    wsRef.current.send(jsonMessage);
    addMessage('sent', jsonMessage);
  }, [addMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const renderMessage = ({ item }: { item: WebSocketMessage }) => (
    <View
      style={[
        styles.messageContainer,
        item.type === 'sent' ? styles.sentMessage : styles.receivedMessage,
      ]}
    >
      <View style={styles.messageHeader}>
        <Text style={styles.messageType}>
          {item.type === 'sent' ? 'SENT' : 'RECEIVED'}
        </Text>
        <Text style={styles.messageTime}>
          {item.timestamp.toLocaleTimeString()}
        </Text>
      </View>
      <Text style={styles.messageData}>{item.data}</Text>
    </View>
  );

  const isConnected = status === 'connected';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>WebSocket Testing</Text>
        <Text style={styles.headerSubtitle}>
          Connect, send messages, and view WebSocket traffic
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.statusBar}>
          <View style={styles.statusIndicator}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(status) },
              ]}
            />
            <Text style={styles.statusText}>{getStatusText(status)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Server URL</Text>
        <TextInput
          style={styles.urlInput}
          value={serverUrl}
          onChangeText={setServerUrl}
          placeholder="wss://echo.websocket.org"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isConnected}
        />

        <View style={styles.buttonRow}>
          <ButtonComponent
            title="Connect"
            onPress={connect}
            color="#4CAF50"
            loading={status === 'connecting'}
            disabled={isConnected}
          />
          <ButtonComponent
            title="Disconnect"
            onPress={disconnect}
            color="#F44336"
            disabled={!isConnected}
          />
        </View>

        <Text style={styles.sectionTitle}>Send Message</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.messageInput}
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder="Type a message..."
            editable={isConnected}
          />
          <TouchableOpacity
            style={[styles.sendButton, !isConnected && styles.buttonDisabled]}
            onPress={sendMessage}
            disabled={!isConnected}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.buttonRow}>
          <ButtonComponent
            title="Send Ping"
            onPress={sendPing}
            color="#2196F3"
            disabled={!isConnected}
          />
          <ButtonComponent
            title="Send JSON"
            onPress={sendJsonMessage}
            color="#9C27B0"
            disabled={!isConnected}
          />
        </View>

        <View style={styles.messagesHeader}>
          <Text style={styles.sectionTitle}>Messages</Text>
          <TouchableOpacity onPress={clearMessages}>
            <Text style={styles.clearButton}>Clear</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.messagesContainer}>
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No messages yet. Connect and send a message to see it here.
              </Text>
            </View>
          ) : (
            <FlatList
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.messagesList}
            />
          )}
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>How to use:</Text>
          <Text style={styles.instructionsText}>
            1. Enter a WebSocket server URL (default is echo server){'\n'}
            2. Tap "Connect" to establish connection{'\n'}
            3. Type messages and tap "Send" to transmit{'\n'}
            4. Use "Send Ping" or "Send JSON" for quick tests{'\n'}
            5. View sent/received messages in real-time{'\n'}
            6. Check the network logger for WebSocket frames
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  body: {
    flex: 1,
    padding: 20,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  urlInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  messagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearButton: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    minHeight: 150,
    maxHeight: 250,
  },
  messagesList: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    color: '#999',
    textAlign: 'center',
    fontSize: 14,
  },
  messageContainer: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  sentMessage: {
    backgroundColor: '#E3F2FD',
    marginLeft: 20,
  },
  receivedMessage: {
    backgroundColor: '#F5F5F5',
    marginRight: 20,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  messageType: {
    fontSize: 10,
    fontWeight: '700',
    color: '#666',
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
  },
  messageData: {
    fontSize: 13,
    color: '#333',
  },
  instructions: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 100,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 13,
    color: '#F57C00',
    lineHeight: 20,
  },
});
