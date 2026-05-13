import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type { ThemeMode } from '../../constants/colors';
import { getThemeColors } from '../../constants/colors';

interface JsonViewerProps {
  data: string | object | null;
  theme?: ThemeMode;
  initialExpanded?: boolean;
  maxInitialDepth?: number;
  style?: StyleProp<ViewStyle>;
}

interface JsonNodeProps {
  keyName?: string;
  value: unknown;
  depth: number;
  theme: ThemeMode;
  maxInitialDepth: number;
  isLast: boolean;
}

const syntaxColors = {
  light: {
    key: '#881391',
    string: '#1A1AA6',
    number: '#098658',
    boolean: '#0000FF',
    null: '#808080',
    bracket: '#333333',
    punctuation: '#666666',
  },
  dark: {
    key: '#9CDCFE',
    string: '#CE9178',
    number: '#B5CEA8',
    boolean: '#569CD6',
    null: '#808080',
    bracket: '#D4D4D4',
    punctuation: '#AAAAAA',
  },
};

const JsonNode: React.FC<JsonNodeProps> = ({
  keyName,
  value,
  depth,
  theme,
  maxInitialDepth,
  isLast,
}) => {
  const [isExpanded, setIsExpanded] = useState(depth < maxInitialDepth);
  const themeColors = getThemeColors(theme);
  const syntaxTheme = syntaxColors[theme];
  const indent = depth * 16;

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const renderValue = useCallback(
    (val: unknown): React.ReactNode => {
      if (val === null) {
        return <Text style={{ color: syntaxTheme.null }}>null</Text>;
      }

      if (val === undefined) {
        return <Text style={{ color: syntaxTheme.null }}>undefined</Text>;
      }

      switch (typeof val) {
        case 'string':
          return (
            <Text style={{ color: syntaxTheme.string }} numberOfLines={3}>
              "{val}"
            </Text>
          );
        case 'number':
          return <Text style={{ color: syntaxTheme.number }}>{val}</Text>;
        case 'boolean':
          return (
            <Text style={{ color: syntaxTheme.boolean }}>
              {val ? 'true' : 'false'}
            </Text>
          );
        default:
          return <Text style={{ color: themeColors.text }}>{String(val)}</Text>;
      }
    },
    [syntaxTheme, themeColors]
  );

  const comma = isLast ? '' : ',';

  if (value === null || value === undefined) {
    return (
      <View style={[styles.row, { marginLeft: indent }]}>
        {keyName !== undefined && (
          <>
            <Text style={{ color: syntaxTheme.key }}>"{keyName}"</Text>
            <Text style={{ color: syntaxTheme.punctuation }}>: </Text>
          </>
        )}
        {renderValue(value)}
        <Text style={{ color: syntaxTheme.punctuation }}>{comma}</Text>
      </View>
    );
  }

  if (typeof value !== 'object') {
    return (
      <View style={[styles.row, { marginLeft: indent }]}>
        {keyName !== undefined && (
          <>
            <Text style={{ color: syntaxTheme.key }}>"{keyName}"</Text>
            <Text style={{ color: syntaxTheme.punctuation }}>: </Text>
          </>
        )}
        {renderValue(value)}
        <Text style={{ color: syntaxTheme.punctuation }}>{comma}</Text>
      </View>
    );
  }

  const isArray = Array.isArray(value);
  const entries = isArray
    ? value.map((v, i) => [i, v] as [number, unknown])
    : Object.entries(value);
  const isEmpty = entries.length === 0;
  const openBracket = isArray ? '[' : '{';
  const closeBracket = isArray ? ']' : '}';

  if (isEmpty) {
    return (
      <View style={[styles.row, { marginLeft: indent }]}>
        {keyName !== undefined && (
          <>
            <Text style={{ color: syntaxTheme.key }}>"{keyName}"</Text>
            <Text style={{ color: syntaxTheme.punctuation }}>: </Text>
          </>
        )}
        <Text style={{ color: syntaxTheme.bracket }}>
          {openBracket}
          {closeBracket}
        </Text>
        <Text style={{ color: syntaxTheme.punctuation }}>{comma}</Text>
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity
        style={[styles.row, { marginLeft: indent }]}
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <Text style={[styles.expandIcon, { color: themeColors.textSecondary }]}>
          {isExpanded ? '▼' : '▶'}
        </Text>
        {keyName !== undefined && (
          <>
            <Text style={{ color: syntaxTheme.key }}>"{keyName}"</Text>
            <Text style={{ color: syntaxTheme.punctuation }}>: </Text>
          </>
        )}
        <Text style={{ color: syntaxTheme.bracket }}>{openBracket}</Text>
        {!isExpanded && (
          <>
            <Text style={{ color: themeColors.textMuted }}>
              {' '}
              {entries.length} {isArray ? 'items' : 'keys'}{' '}
            </Text>
            <Text style={{ color: syntaxTheme.bracket }}>{closeBracket}</Text>
            <Text style={{ color: syntaxTheme.punctuation }}>{comma}</Text>
          </>
        )}
      </TouchableOpacity>

      {isExpanded && (
        <>
          {entries.map(([key, val], index) => (
            <JsonNode
              key={String(key)}
              keyName={isArray ? undefined : String(key)}
              value={val}
              depth={depth + 1}
              theme={theme}
              maxInitialDepth={maxInitialDepth}
              isLast={index === entries.length - 1}
            />
          ))}
          <View style={[styles.row, { marginLeft: indent }]}>
            <Text style={{ color: syntaxTheme.bracket }}>{closeBracket}</Text>
            <Text style={{ color: syntaxTheme.punctuation }}>{comma}</Text>
          </View>
        </>
      )}
    </View>
  );
};

export const JsonViewer: React.FC<JsonViewerProps> = ({
  data,
  theme = 'light',
  initialExpanded = true,
  maxInitialDepth = 2,
  style,
}) => {
  const themeColors = getThemeColors(theme);

  const parsedData = useMemo(() => {
    if (data === null || data === undefined) {
      return null;
    }
    if (typeof data === 'object') {
      return data;
    }
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    }
    return data;
  }, [data]);

  if (parsedData === null || parsedData === undefined) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: themeColors.codeBackground },
          style,
        ]}
      >
        <Text style={{ color: themeColors.textMuted }}>No data</Text>
      </View>
    );
  }

  if (typeof parsedData === 'string') {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: themeColors.codeBackground },
          style,
        ]}
      >
        <Text style={[styles.rawText, { color: themeColors.text }]}>
          {parsedData}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeColors.codeBackground },
        style,
      ]}
    >
      <JsonNode
        value={parsedData}
        depth={0}
        theme={theme}
        maxInitialDepth={initialExpanded ? maxInitialDepth : 0}
        isLast={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    paddingVertical: 2,
  },
  expandIcon: {
    width: 16,
    fontSize: 10,
    marginRight: 4,
  },
  rawText: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 18,
  },
});
