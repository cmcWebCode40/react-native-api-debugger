import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SvgIcon } from '../../icons';
import { colors } from '../../constants/colors';

let Clipboard: any = null;
try {
  Clipboard = require('@react-native-clipboard/clipboard').default;
} catch {
  Clipboard = null;
}

interface CopyItemProps {
  textToCopy: string;
  size?: number;
  checkDuration?: number;
  style?: StyleProp<ViewStyle>;
  useCopyToClipboard?: boolean;
}

export const CopyItem: React.FC<CopyItemProps> = ({
  textToCopy,
  checkDuration = 2000,
  style,
  size = 16,
  useCopyToClipboard,
}) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (useCopyToClipboard && !Clipboard) {
      console.warn(
        '[NetworkLogger] Copy to clipboard enabled but @react-native-clipboard/clipboard is not installed. Install it with: npm install @react-native-clipboard/clipboard'
      );
    }
  }, [useCopyToClipboard]);

  const handleCopy = useCallback(async () => {
    if (!useCopyToClipboard || !Clipboard) {
      return;
    }
    try {
      Clipboard?.setString(textToCopy);
      setCopied(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, checkDuration);
    } catch {
      Alert.alert('Failed to copy to clipboard');
    }
  }, [textToCopy, checkDuration, useCopyToClipboard]);

  if (!useCopyToClipboard) {
    return (
      <View style={[style, styles.disabledContainer]}>
        <Text style={styles.disabledText}>Copy not enabled</Text>
      </View>
    );
  }

  if (!Clipboard) {
    return (
      <View style={[style, styles.disabledContainer]}>
        <Text style={styles.disabledText}>Clipboard unavailable</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleCopy}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={copied ? 'Copied to clipboard' : 'Copy to clipboard'}
      disabled={!useCopyToClipboard}
    >
      {copied ? (
        <SvgIcon name="check" size={size} color={colors.success} />
      ) : (
        <SvgIcon name="copy" size={size} color="#94A3B8" />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 4,
  },
  disabledContainer: {
    opacity: 0.6,
  },
  disabledText: {
    fontSize: 10,
    color: '#64748B',
    fontStyle: 'italic',
  },
});
