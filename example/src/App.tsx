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

  useEffect(() => {
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

  // Test Error Request
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
                title="Test 404 Error"
                onPress={handleErrorRequest}
                buttonId="errorRequest"
                color="#F44336"
                loading={loading.errorRequest}
              />
            </View>

            <View style={styles.instructions}>
              <Text style={styles.instructionsTitle}>📊 How to use:</Text>
              <Text style={styles.instructionsText}>
                1. Tap any button to make an API request{'\n'}
                2. Check the floating network logger button{'\n'}
                3. Tap the logger to view request details{'\n'}
                4. Expand requests to see headers & responses{'\n'}
                5. Use cURL generation for debugging
              </Text>
            </View>
          </View>
        </ScrollView>
        <NetworkLoggerOverlay
          draggable={true}
          enableDeviceShake={false}
          useCopyToClipboard={true}
          showRequestHeader={false}
          showResponseHeader={false}
          networkLogger={networkLogger}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
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
    lineHeight: 20,
  },
});

export default App;
