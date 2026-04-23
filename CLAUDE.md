# React Native API Debugger - Development Guide

## Project Overview

A comprehensive network request debugging SDK for React Native applications. Intercepts and visualizes HTTP requests with a draggable overlay interface.

## Architecture

### Directory Structure

```
src/
├── index.tsx                 # Public API exports
├── types.ts                  # TypeScript interfaces and types
├── NetworkInterceptor.ts     # Core request interception engine
├── NetworkLoggerOverlay.tsx  # Main overlay container component
├── NetworkLogItem.tsx        # Individual log entry component
├── FloatingButton.tsx        # Draggable trigger button
├── NonFloatingButton.tsx     # Static trigger button fallback
├── CopyItem.tsx              # Clipboard copy component
├── Icon.tsx                  # Emoji-based icon component
├── components/               # Reusable UI components (new)
│   ├── index.ts              # Component exports
│   ├── Badge.tsx             # Status badge component
│   ├── FilterChip.tsx        # Filter tag component
│   ├── SearchInput.tsx       # Search input component
│   └── JsonViewer.tsx        # JSON tree viewer component
├── hooks/                    # Custom React hooks (new)
│   ├── index.ts              # Hook exports
│   ├── useNetworkLogs.ts     # Log subscription hook
│   └── useFilteredLogs.ts    # Log filtering hook
├── utils/                    # Utility functions (new)
│   ├── index.ts              # Utility exports
│   ├── formatters.ts         # Data formatting utilities
│   ├── curl.ts               # cURL generation
│   └── filters.ts            # Filter logic
└── constants/                # Constants and config (new)
    ├── index.ts              # Constants exports
    ├── colors.ts             # Color palette
    └── config.ts             # Default configuration
```

### Component Design System

#### Design Principles

1. **Single Responsibility**: Each component handles one concern
2. **Composition over Inheritance**: Build complex UIs from simple pieces
3. **Graceful Degradation**: Features work without optional dependencies
4. **Zero Config Defaults**: Works out of the box with sensible defaults
5. **TypeScript First**: Full type safety with exported interfaces

#### Component Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| **Core** | Business logic & interception | `NetworkInterceptor` |
| **Container** | State management & data flow | `NetworkLoggerOverlay` |
| **Presentational** | Pure UI rendering | `NetworkLogItem`, `Badge`, `FilterChip` |
| **Interactive** | User interaction handling | `FloatingButton`, `CopyItem` |
| **Utility** | Shared functionality | `Icon`, `JsonViewer` |

#### Reusable Component Guidelines

```typescript
// Component Template
interface ComponentProps {
  // Required props first
  requiredProp: string;
  // Optional props with defaults
  optionalProp?: boolean;
  // Style overrides last
  style?: StyleProp<ViewStyle>;
}

const Component: React.FC<ComponentProps> = ({
  requiredProp,
  optionalProp = false,
  style,
}) => {
  // Implementation
};
```

### State Management

- **Local State**: React `useState` for component-specific state
- **Shared State**: Pub/sub pattern via `NetworkLogger.subscribe()`
- **No External Dependencies**: No Redux/MobX required

### Styling Conventions

- Use `StyleSheet.create()` for all styles
- Define styles at bottom of component file
- Use semantic color names from `constants/colors.ts`
- Support both light and dark themes

## Configuration

### NetworkLogger Config Interface

```typescript
interface NetworkLoggerConfig {
  maxLogs: number;              // Default: 100
  ignoredUrls: string[];        // URL patterns to ignore
  ignoredDomains: string[];     // Domains to ignore
  redactHeaders: string[];      // Headers to mask (e.g., 'Authorization')
  enablePersistence: boolean;   // Persist logs across sessions
  slowRequestThreshold: number; // ms threshold for slow request warning
}
```

### Overlay Config Interface

```typescript
interface NetworkLoggerOverlayProps {
  networkLogger: NetworkLogger;
  // Feature flags
  draggable?: boolean;
  enableDeviceShake?: boolean;
  useCopyToClipboard?: boolean;
  // Display options
  showRequestHeader?: boolean;
  showResponseHeader?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  // Filtering
  defaultFilters?: FilterConfig;
}
```

## Development Workflow

### Commands

```bash
# Install dependencies
yarn install

# Run example app
yarn example start

# Type checking
yarn typecheck

# Linting
yarn lint

# Run tests
yarn test

# Build library
yarn prepare

# Release
yarn release
```

### Adding New Features

1. Create feature branch from `main`
2. Add types to `types.ts`
3. Implement in appropriate directory (components/hooks/utils)
4. Export from index files
5. Add example usage in `example/src/`
6. Update README if public API changes
7. Write tests for new functionality

### Testing Strategy

- Unit tests for utility functions
- Component tests for UI components
- Integration tests for interceptor logic
- Manual testing via example app

## Optional Peer Dependencies

| Package | Required For |
|---------|--------------|
| `react-native-gesture-handler` | Draggable floating button |
| `react-native-reanimated` | Smooth animations |
| `react-native-shake` | Device shake detection |
| `@react-native-clipboard/clipboard` | Copy to clipboard |

## Code Style

- Use TypeScript strict mode
- Prefer functional components with hooks
- Use explicit return types on functions
- Document public APIs with JSDoc
- Follow React Native community conventions

## Performance Guidelines

- Limit stored logs (default: 100)
- Use `FlatList` with optimization props
- Lazy load optional dependencies
- Avoid re-renders with `React.memo` where appropriate
- Use `useCallback` for event handlers passed as props
