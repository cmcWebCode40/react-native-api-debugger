import { StyleSheet, Text } from 'react-native';
import React from 'react';

const icons = {
  copy: '📋',
  done: '✅',
  close: '✕',
  chevronDown: '▼',
  chevronUp: '▲',
  error: '❌',
};

interface IconProps {
  type: 'copy' | 'done' | 'close' | 'chevronDown' | 'chevronUp' | 'error';
}

const Icon: React.FunctionComponent<IconProps> = ({ type }) => {
  return <Text style={styles.closeButton}>{icons[type]}</Text>;
};

export default Icon;

const styles = StyleSheet.create({
  closeButton: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
  },
});
