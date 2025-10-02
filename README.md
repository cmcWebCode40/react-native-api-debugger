# React Native API Debugger

A comprehensive network request debugging tool for React Native applications. Monitor, inspect, and debug all your app's network requests with an intuitive draggable overlay interface.

[![Version](https://img.shields.io/npm/v/react-native-api-debugger)](https://www.npmjs.com/package/react-native-api-debugger)
[![Downloads](https://img.shields.io/npm/dm/react-native-api-debugger)](https://www.npmjs.com/package/react-native-api-debugger)
[![License](https://img.shields.io/npm/l/react-native-api-debugger)](https://github.com/cmcWebCode40/react-native-api-debugger/blob/main/LICENSE)
[![Platform](https://img.shields.io/badge/platform-react--native-blue)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/typescript-supported-blue)](https://www.typescriptlang.org/)

![React Native API Debugger](https://github.com/user-attachments/assets/701ddead-776b-4385-bf20-e2f4154f65c3)

## ✨ Features

- 🔍 **Real-time Network Monitoring** - Automatically intercepts all `fetch()` and `XMLHttpRequest` calls
- 🎯 **Draggable Overlay Interface** - Non-intrusive floating button that can be moved anywhere on screen
- 📊 **Comprehensive Request Details** - View headers, body, response, timing, and status codes
- 📋 **cURL Generation** - Copy requests as cURL commands for easy debugging
- 🔎 **Advanced Filtering** - Search and filter by URL, method, status, or API endpoints
- ❌ **Error Tracking** - Easily identify failed requests and network errors
- 📱 **Device Shake Support** - Optional shake-to-show/hide functionality
- 📋 **Copy to Clipboard** - Optionally copy request/response/cURL details
- 🎨 **Customizable UI** - Configure header visibility and other display options
- 🚀 **TypeScript Support** - Full TypeScript definitions included
- 💾 **Memory Efficient** - Automatic cleanup with configurable request limits

## 📦 Installation

```bash
npm install react-native-api-debugger
```

> **Note:** Features like draggable overlay, device shake, and clipboard copy require additional peer dependencies.  
> The debugger will throw a clear error if you enable a feature and the relevant library is not installed.

### Optional Peer Dependencies

Install these only if you need advanced features:

```bash
npm install @react-native-clipboard/clipboard     # For copy to clipboard
npm install react-native-shake                   # For device shake to show/hide
npm install react-native-gesture-handler         # For draggable floating button
npm install react-native-reanimated              # (Required for gesture handler)
```

> **Note:** For Expo SDK ≤ 53, use `react-native-reanimated` version 3.x.x

### Platform Setup

If you use **draggable overlay** or **device shake**, also follow their respective setup guides:

- **react-native-gesture-handler**: [Installation Guide](https://docs.swmansion.com/react-native-gesture-handler/docs/installation)
- **react-native-reanimated**: [Installation Guide](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started)

---

## 🚀 Quick Start

### Minimal Example

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

      {/* Minimal usage: All advanced features turned off */}
      <NetworkLoggerOverlay
        draggable={false}
        enableDeviceShake={false}
        useCopyToClipboard={false}
        showRequestHeader={false}
        showResponseHeader={false}
        networkLogger={networkLogger}
      />
    </View>
  );
}
```

---

### Full Features Example

```typescript
<NetworkLoggerOverlay
  networkLogger={networkLogger}
  draggable={true}                // Requires react-native-gesture-handler & react-native-reanimated
  enableDeviceShake={true}        // Requires react-native-shake
  useCopyToClipboard={true}       // Requires @react-native-clipboard/clipboard
  showRequestHeader={true}
  showResponseHeader={true}
/>
```

> ⚠️ **Important:**  
> If you enable `draggable`, `enableDeviceShake`, or `useCopyToClipboard` **without installing the corresponding peer dependency**, the debugger will throw a descriptive error at runtime, guiding you to install the required package.

---

## 📚 API Reference

### NetworkLoggerOverlay

The main UI component that displays the network logs with a draggable floating button interface.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `networkLogger` | `NetworkLogger` | **Required** | The network logger instance |
| `enableDeviceShake` | `boolean` | `false` | Enable shake-to-show/hide functionality *(requires `react-native-shake`)* |
| `draggable` | `boolean` | `false` | Enable draggable floating button *(requires `react-native-gesture-handler` and `react-native-reanimated`)* |
| `useCopyToClipboard` | `boolean` | `false` | Enable copy to clipboard *(requires `@react-native-clipboard/clipboard`)* |
| `showRequestHeader` | `boolean` | `false` | Display request headers in log details |
| `showResponseHeader` | `boolean` | `false` | Display response headers in log details |

#### Usage Examples

```typescript
// Minimal setup
<NetworkLoggerOverlay networkLogger={networkLogger} />

// With device shake support (if installed)
<NetworkLoggerOverlay 
  networkLogger={networkLogger}
  enableDeviceShake={true}
/>

// Full-featured setup (requires peer dependencies)
<NetworkLoggerOverlay 
  networkLogger={networkLogger}
  enableDeviceShake={true}
  draggable={true}
  useCopyToClipboard={true}
  showRequestHeader={true}
  showResponseHeader={true}
/>
```

### NetworkLogger

The core logger instance that handles request interception and storage.

#### Methods

| Method | Description |
|--------|-------------|
| `setupInterceptor()` | Initialize network request interception |
| `clearLogs()` | Clear all stored network logs |
| `getLogs()` | Get array of all stored network logs |

## 🛠️ Usage Patterns

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
          draggable={true}
          useCopyToClipboard={true}
        />
      )}
    </View>
  );
}
```

---

## 🎯 TypeScript Support

The package includes comprehensive TypeScript definitions:

```typescript
import type { 
  NetworkLog, 
  NetworkResponse, 
  NetworkRequestHeaders,
  LogListener,
  NetworkLoggerConfig
} from 'react-native-api-debugger';

// Example: Custom log processing
const processNetworkLogs = (logs: NetworkLog[]) => {
  const failedRequests = logs.filter(log => 
    log.response && log.response.status >= 400
  );
  
  console.log(`Found ${failedRequests.length} failed requests`);
};
```

## 🔧 Troubleshooting

### Common Issues

#### TypeScript Errors
```typescript
// Ensure correct imports for types
import type { NetworkLog } from 'react-native-api-debugger';
```

#### Gesture Handler Setup
```typescript
// Make sure to wrap your app with GestureHandlerRootView for draggable functionality
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Your app content */}
    </GestureHandlerRootView>
  );
}
```

### Performance Considerations

- **Memory Management**: The logger automatically limits stored requests to prevent memory issues (default: 100 requests)
- **Production Builds**: Always disable in production to avoid performance impact
- **Large Responses**: Consider filtering or truncating large response bodies


### Production Safety

```typescript
// Environment-based configuration
const isDev = __DEV__;
const isStaging = process.env.NODE_ENV === 'staging';

const showLogger = isDev || isStaging;

export default function App() {
  useEffect(() => {
    if (showLogger) {
      networkLogger.setupInterceptor();
    }
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {/* Your app content */}
      {showLogger && (
        <NetworkLoggerOverlay networkLogger={networkLogger} />
      )}
    </View>
  );
}
```

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Clone your fork**: `git clone https://github.com/cmcWebCode40/react-native-api-debugger.git`
3. **Install dependencies**: `npm install`
4. **Create a feature branch**: `git checkout -b feature/amazing-feature`
5. **Make your changes** and add tests
6. **Run tests**: `npm test`
7. **Commit changes**: `git commit -m 'Add amazing feature'`
8. **Push to branch**: `git push origin feature/amazing-feature`
9. **Open a Pull Request**

### Development Setup

```bash
# Clone the repository
git clone https://github.com/cmcWebCode40/react-native-api-debugger.git

# Install dependencies
cd react-native-api-debugger
npm install

# Run tests
npm test

# Start the example app
cd example
npm install
npx react-native run-ios # or run-android
```

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Community

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/cmcWebCode40/react-native-api-debugger/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/cmcWebCode40/react-native-api-debugger/discussions)
- 📖 **Documentation**: [Wiki](https://github.com/cmcWebCode40/react-native-api-debugger/wiki)
- 💬 **Community**: [Discord Server](https://discord.gg/your-discord)
- 🐦 **Updates**: [@YourTwitter](https://twitter.com/your-twitter)

## 📊 Stats & Recognition

<div align="center">

**Made with ❤️ for the React Native community**

</div>

---

*Built with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)*