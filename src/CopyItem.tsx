import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Alert,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
// import Clipboard from '@react-native-clipboard/clipboard';
import Icon from './Icon';

interface CopyItemProps {
  textToCopy: string;
  checkDuration?: number;
  style?: StyleProp<ViewStyle>;
}

export const CopyItem: React.FC<CopyItemProps> = ({
  textToCopy,
  checkDuration = 2000,
  style,
}) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      // Clipboard.setString(textToCopy);
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
  }, [textToCopy, checkDuration]);

  return (
    <TouchableOpacity
      style={style}
      onPress={handleCopy}
      activeOpacity={0.5}
      accessibilityRole="button"
      accessibilityLabel={copied ? 'Copied to clipboard' : 'Copy to clipboard'}
    >
      {copied ? <Icon type="done" /> : <Icon type="copy" />}
    </TouchableOpacity>
  );
};
