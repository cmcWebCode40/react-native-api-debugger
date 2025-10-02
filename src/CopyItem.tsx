import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Alert,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Icon from './Icon';

let Clipboard: any = null;
try {
  Clipboard = require('@react-native-clipboard/clipboard').default;
} catch (error) {
  Clipboard = null;
}

interface CopyItemProps {
  textToCopy: string;
  checkDuration?: number;
  style?: StyleProp<ViewStyle>;
  useCopyToClipboard?: boolean;
}

export const CopyItem: React.FC<CopyItemProps> = ({
  textToCopy,
  checkDuration = 2000,
  style,
  useCopyToClipboard,
}) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (useCopyToClipboard && !Clipboard) {
      throw new Error(
        'Copy to clipboard functionality is required (useCopyToClipboard=true) but @react-native-clipboard/clipboard module is not installed. Please install it with: npm install @react-native-clipboard/clipboard'
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
    return null;
  }

  if (!Clipboard) {
    return null;
  }

  return (
    <TouchableOpacity
      style={style}
      onPress={handleCopy}
      activeOpacity={0.5}
      accessibilityRole="button"
      accessibilityLabel={copied ? 'Copied to clipboard' : 'Copy to clipboard'}
      disabled={!useCopyToClipboard}
    >
      {copied ? <Icon type="done" /> : <Icon type="copy" />}
    </TouchableOpacity>
  );
};
