# React Native API Debugger

A comprehensive network request debugging tool for React Native applications. Monitor, inspect, and debug all your app's network requests with an intuitive overlay interface.

[![Version](https://img.shields.io/npm/v/react-native-api-logger)](https://www.npmjs.com/package/react-native-api-logger)
[![License](https://img.shields.io/npm/l/react-native-api-logger)](https://github.com/your-username/react-native-api-logger/blob/main/LICENSE)
[![Platform](https://img.shields.io/badge/platform-react--native-blue)](https://reactnative.dev/)



<img
  src="/demo/demo_RN_logger.png"
  alt="Alt text"
  title="React Native API Logger"
  style="margin:0 4px; width: 100px"
/>


## Features

- **Real-time Network Monitoring** - Automatically intercepts all fetch() and XMLHttpRequest calls
- **Overlay Interface** - Non-intrusive floating button and modal interface
- **Request Details** - View headers, body, response, timing, and status codes
- **cURL Generation** - Copy requests as cURL commands for debugging
-  **Request Filtering** - Search and filter by URL, method, or API endpoints
- **Error Tracking** - Easily identify failed requests and network errors
- **Device Shake Support** - Optional shake-to-show functionality

## Installation

```bash
npm install react-native-api-debugger
```

### Peer Dependencies

This package requires the following peer dependencies:

```bash
npm install @react-native-clipboard/clipboard react-native-shake
```


## Quick Start

### Basic Usage

```typescript
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { networkLogger, NetworkLoggerOverlay } from 'react-native-api-debugger';

export default function App() {
  useEffect(() => {
    // Initialize the network logger
    networkLogger.setupInterceptor();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {/* Your app content */}
      
      {/* Add the network logger overlay */}
      <NetworkLoggerOverlay networkLogger={networkLogger} />
    </View>
  );
}
```

### With Device Shake Support

```typescript
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { networkLogger, NetworkLoggerOverlay } from 'react-native-api-debugger';

export default function App() {
  useEffect(() => {
    networkLogger.setupInterceptor();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {/* Your app content */}
      
      {/* Enable shake-to-show functionality */}
      <NetworkLoggerOverlay 
        networkLogger={networkLogger} 
        enableDeviceShake={true}
      />
    </View>
  );
}
```


### NetworkLoggerOverlay

The UI component that displays the network logs.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `networkLogger` | `NetworkLogger` | **Required** | The network logger instance |
| `enableDeviceShake` | `boolean` | `false` | Enable shake-to-show functionality |

#### Example

```typescript
<NetworkLoggerOverlay 
  networkLogger={networkLogger}
  enableDeviceShake={true}
/>
```

### Types

The package exports TypeScript types for better development experience:

```typescript
import type { 
  NetworkLog, 
  NetworkResponse, 
  NetworkRequestHeaders,
  LogListener 
} from 'react-native-api-debugger';
```

## Usage Examples

### Development vs Production

```typescript
import { networkLogger, NetworkLoggerOverlay } from 'react-native-api-debugger';

export default function App() {
  useEffect(() => {
    // Only enable in development
    if (__DEV__) {
      networkLogger.setupInterceptor();
    }
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {/* Your app content */}
      
      {/* Only show in development */}
      {__DEV__ && (
        <NetworkLoggerOverlay 
          networkLogger={networkLogger}
          enableDeviceShake={true}
        />
      )}
    </View>
  );
}
```

## Best Practices

### 1. Development Only

```typescript
// Only enable in development builds
if (__DEV__) {
  networkLogger.setupInterceptor();
}
```

### 2. Memory Management

The logger automatically limits stored requests to prevent memory issues:
- Maximum 100 requests stored
- Oldest requests are automatically removed

### 3. Sensitive Data

Be cautious with sensitive data in network requests:
- The logger captures all headers and request/response bodies
- Consider disabling in production builds
- Review logged data before sharing screenshots


### TypeScript Errors

1. Ensure you're importing types correctly:
```typescript
import type { NetworkLog } from 'react-native-api-logger';
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/your-username/react-native-api-logger/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/your-username/react-native-api-logger/discussions)
- 📖 **Documentation**: [Wiki](https://github.com/your-username/react-native-api-logger/wiki)

---

**Made with ❤️ for React Native developers**

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
