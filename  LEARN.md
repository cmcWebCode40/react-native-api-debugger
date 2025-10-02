# Learn: React Native API Debugger

Welcome to the **React Native API Debugger** learning guide!  
This resource is built for students, educators, and anyone eager to learn about debugging, inspecting, and analyzing network requests in React Native applications.

---

## 🚀 What Will You Learn?

- **How to intercept and inspect network requests** in a React Native app.
- **How to debug APIs visually** using a draggable overlay.
- **How to use advanced features** like copying cURL, device shake, and filtering.
- **How to integrate optional native modules** in a cross-platform project.
- **Best practices for debugging and securing mobile apps.**

---

## 🛠️ Prerequisites

- Basic knowledge of [React Native](https://reactnative.dev/docs/getting-started).
- Node.js and npm installed on your machine.
- A working React Native project (Expo or CLI).

---

## 📦 Getting Started

### 1. Install the Package

```bash
npm install react-native-api-debugger
```

### 2. (Optional) Install Peer Dependencies

To unlock advanced features, install these as needed:

```bash
npm install @react-native-clipboard/clipboard react-native-shake react-native-gesture-handler react-native-reanimated
```

> The debugger will throw clear errors if you enable an advanced feature but haven't installed its dependency.

---

## 🧑‍💻 Hands-On Exercise

### Step 1: Basic Setup

Add the overlay to your app:

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

### Step 2: Enable Features

Try enabling features one by one. For example, after installing `@react-native-clipboard/clipboard`, set `useCopyToClipboard={true}` in the overlay props and see how copy-to-clipboard works.

### Step 3: Experiment

- Make network requests in your app (e.g., with `fetch`).
- Observe them appearing in the overlay.
- Try filtering requests, copying cURL commands, and inspecting headers.

---

## 🎓 Learning Activities

### Activity 1: Debug a Real API

- Integrate the debugger into a simple app.
- Make requests to a public API (like [JSONPlaceholder](https://jsonplaceholder.typicode.com/)).
- Use the overlay to inspect request/response data.

### Activity 2: Secure Your App

- Discuss why you should only use network debugging tools in development.
- Explore how to exclude sensitive endpoints (see `excludeUrls` in the docs).

### Activity 3: Extend the Debugger

- Propose a new feature (e.g., dark mode or exporting logs).
- Fork the repo, add your feature, and open a pull request!

---

## 💡 Discussion Questions

- Why is it important to inspect network requests during development?
- What risks are associated with logging network data in production?
- How can modular, optional dependencies improve the developer experience in React Native?

---

## 🏆 Share Your Learning

- Post your project or screenshots using `react-native-api-debugger` on social media.
- Tag [@cmcWebCode](https://x.com/cmcWebCode) or open a discussion in [GitHub Discussions](https://github.com/cmcWebCode40/react-native-api-debugger/discussions).

---

## 📚 More Resources

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [API Debugging Basics](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview)
- [GitHub Education](https://education.github.com/)

---

**Happy Debugging! 🚦**