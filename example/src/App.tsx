import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { networkLogger, NetworkLoggerOverlay } from 'react-native-api-debugger';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

interface LoadingState {
  [key: string]: boolean;
}

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  website: string;
  company: {
    name: string;
    catchPhrase: string;
  };
}

interface ButtonComponentProps {
  title: string;
  onPress: () => void;
  buttonId: string;
  color?: string;
  loading?: boolean;
}

interface APIResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

const ButtonComponent: React.FC<ButtonComponentProps> = ({
  title,
  onPress,
  color = '#007AFF',
  loading = false,
}) => (
  <TouchableOpacity
    style={[styles.button, { backgroundColor: color }]}
    onPress={onPress}
    disabled={loading}
    activeOpacity={0.8}
  >
    {loading ? (
      <ActivityIndicator color="#fff" size="small" />
    ) : (
      <Text style={styles.buttonText}>{title}</Text>
    )}
  </TouchableOpacity>
);

const App: React.FC = () => {
  const [loading, setLoading] = useState<LoadingState>({});
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

  const setButtonLoading = (buttonId: string, isLoading: boolean): void => {
    setLoading((prev) => ({ ...prev, [buttonId]: isLoading }));
  };

  const showResult = (title: string, success: boolean, data: any): void => {
    Alert.alert(
      title,
      success ? `Success: ${JSON.stringify(data, null, 2)}` : `Error: ${data}`,
      [{ text: 'OK' }]
    );
  };

  const makeAPIRequest = async <T = any,>(
    url: string,
    options: RequestInit = {},
    buttonId: string,
    successMessage: (data: T) => string
  ): Promise<APIResponse<T>> => {
    setButtonLoading(buttonId, true);

    try {
      const response: Response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data: T = await response.json();

      if (response.ok) {
        showResult(
          `${options.method || 'GET'} Success`,
          true,
          successMessage(data)
        );
        return { data, success: true };
      } else {
        showResult(`${options.method || 'GET'} Error`, false, data);
        return { error: `HTTP ${response.status}`, success: false };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      showResult(`${options.method || 'GET'} Error`, false, errorMessage);
      return { error: errorMessage, success: false };
    } finally {
      setButtonLoading(buttonId, false);
    }
  };

  // GET Request 1 - JSONPlaceholder Posts
  const handleGetPosts = async (): Promise<void> => {
    await makeAPIRequest<Post[]>(
      'https://jsonplaceholder.typicode.com/posts?_limit=5',
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
      },
      'getPosts',
      (data) => `Fetched ${data.length} posts`
    );
  };

  // GET Request 2 - JSONPlaceholder Users
  const handleGetUsers = async (): Promise<void> => {
    await makeAPIRequest<User[]>(
      'https://jsonplaceholder.typicode.com/users',
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ReactNative-TestApp/1.0',
        },
      },
      'getUsers',
      (data) => `Fetched ${data.length} users`
    );
  };

  // POST Request 1 - Create Post
  const handleCreatePost = async (): Promise<void> => {
    const postData = {
      title: 'Test Post from React Native',
      body: 'This is a test post created from the mobile app',
      userId: 1,
    };

    await makeAPIRequest<Post>(
      'https://jsonplaceholder.typicode.com/posts',
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token-123',
          'X-Client-Version': '1.0.0',
        },
        body: JSON.stringify(postData),
      },
      'createPost',
      (data) => `Created post with ID: ${data.id}`
    );
  };

  // POST Request 2 - Create User
  const handleCreateUser = async (): Promise<void> => {
    const userData = {
      name: 'John Doe',
      username: 'johndoe',
      email: 'john@example.com',
      phone: '1-770-736-8031',
      website: 'johndoe.org',
      company: {
        name: 'Doe Enterprises',
        catchPhrase: 'Testing API endpoints',
      },
    };

    await makeAPIRequest<User>(
      'https://jsonplaceholder.typicode.com/users',
      {
        method: 'POST',
        headers: {
          'X-API-Key': 'mobile-app-key',
          'User-Agent': 'ReactNative/TestApp',
          'X-Request-ID': `req-${Date.now()}`,
        },
        body: JSON.stringify(userData),
      },
      'createUser',
      (data) => `Created user with ID: ${data.id}`
    );
  };

  // Test Error Request (404)
  const handleErrorRequest = async (): Promise<void> => {
    await makeAPIRequest(
      'https://jsonplaceholder.typicode.com/posts/999999',
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      },
      'errorRequest',
      () => 'Unexpected success'
    );
  };

  // Test Server Error (500)
  const handleServerError = async (): Promise<void> => {
    await makeAPIRequest(
      'https://httpstat.us/500',
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      },
      'serverError',
      () => 'Unexpected success'
    );
  };

  // Test Slow Request
  const handleSlowRequest = async (): Promise<void> => {
    await makeAPIRequest(
      'https://httpstat.us/200?sleep=3000',
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      },
      'slowRequest',
      () => 'Slow request completed'
    );
  };

  // Test Ignored URL (should not appear in logs)
  const handleIgnoredRequest = async (): Promise<void> => {
    setButtonLoading('ignoredRequest', true);
    try {
      await fetch('https://jsonplaceholder.typicode.com/health');
      Alert.alert(
        'Ignored Request',
        'This request should NOT appear in the network logger because "/health" is in the ignored URLs list.'
      );
    } catch (error) {
      Alert.alert('Error', 'Request failed');
    } finally {
      setButtonLoading('ignoredRequest', false);
    }
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>API Logger Test App</Text>
            <Text style={styles.headerSubtitle}>
              Test network requests and view them in the logger
            </Text>
          </View>

          <View style={styles.body}>
            <Text style={styles.sectionTitle}>GET Requests</Text>
            <View style={styles.buttonRow}>
              <ButtonComponent
                title="Get Posts"
                onPress={handleGetPosts}
                buttonId="getPosts"
                color="#4CAF50"
                loading={loading.getPosts}
              />
              <ButtonComponent
                title="Get Users"
                onPress={handleGetUsers}
                buttonId="getUsers"
                color="#2196F3"
                loading={loading.getUsers}
              />
            </View>

            <Text style={styles.sectionTitle}>POST Requests</Text>
            <View style={styles.buttonRow}>
              <ButtonComponent
                title="Create Post"
                onPress={handleCreatePost}
                buttonId="createPost"
                color="#FF9800"
                loading={loading.createPost}
              />
              <ButtonComponent
                title="Create User"
                onPress={handleCreateUser}
                buttonId="createUser"
                color="#9C27B0"
                loading={loading.createUser}
              />
            </View>

            <Text style={styles.sectionTitle}>Error & Edge Cases</Text>
            <View style={styles.buttonRow}>
              <ButtonComponent
                title="Test 404"
                onPress={handleErrorRequest}
                buttonId="errorRequest"
                color="#F44336"
                loading={loading.errorRequest}
              />
              <ButtonComponent
                title="Test 500"
                onPress={handleServerError}
                buttonId="serverError"
                color="#9C27B0"
                loading={loading.serverError}
              />
            </View>
            <View style={styles.buttonRow}>
              <ButtonComponent
                title="Slow Request"
                onPress={handleSlowRequest}
                buttonId="slowRequest"
                color="#FF5722"
                loading={loading.slowRequest}
              />
              <ButtonComponent
                title="Ignored URL"
                onPress={handleIgnoredRequest}
                buttonId="ignoredRequest"
                color="#607D8B"
                loading={loading.ignoredRequest}
              />
            </View>

            <Text style={styles.sectionTitle}>Display Settings</Text>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Show Headers</Text>
              <Switch
                value={showHeaders}
                onValueChange={setShowHeaders}
                trackColor={{ false: '#e0e0e0', true: '#81b0ff' }}
                thumbColor={showHeaders ? '#007AFF' : '#f4f3f4'}
              />
            </View>

            <View style={styles.instructions}>
              <Text style={styles.instructionsTitle}>📊 How to use:</Text>
              <Text style={styles.instructionsText}>
                1. Tap any button to make an API request{'\n'}
                2. Check the floating network logger button{'\n'}
                3. Tap the logger to view request details{'\n'}
                4. Use filter chips (2xx, 4xx, 5xx, Errors) to filter logs{'\n'}
                5. Search by URL, method, or response body{'\n'}
                6. Expand requests to see headers & responses{'\n'}
                7. Use cURL generation for debugging
              </Text>
            </View>

            <View style={styles.configInfo}>
              <Text style={styles.configTitle}>⚙️ Current Config:</Text>
              <Text style={styles.configText}>
                • Max Logs: 50{'\n'}• Ignored URLs: /health, /ping{'\n'}• Slow
                Request Threshold: 2000ms{'\n'}• Dev Mode Only: enabled
                (default)
              </Text>
            </View>

            <View style={styles.devModeInfo}>
              <Text style={styles.devModeTitle}>🔒 Production Safety:</Text>
              <Text style={styles.devModeText}>
                The network logger only shows in development builds by default
                (__DEV__). This prevents accidental exposure of sensitive API
                data in production apps.
              </Text>
            </View>
          </View>
        </ScrollView>
        {/* enabled defaults to __DEV__, so it only shows in development builds */}
        <NetworkLoggerOverlay
          draggable={true}
          enableDeviceShake={false}
          useCopyToClipboard={true}
          showRequestHeader={showHeaders}
          showResponseHeader={showHeaders}
          networkLogger={networkLogger}
          // enabled={true} // Uncomment to force enable in production (not recommended)
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
  scrollContent: {
    flexGrow: 1,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginTop: 30,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  configInfo: {
    backgroundColor: '#E3F2FD',
    padding: 20,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  configTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 10,
  },
  configText: {
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  devModeInfo: {
    backgroundColor: '#FCE4EC',
    padding: 20,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#F8BBD9',
  },
  devModeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C2185B',
    marginBottom: 10,
  },
  devModeText: {
    fontSize: 13,
    color: '#AD1457',
    lineHeight: 20,
  },
});

export default App;
