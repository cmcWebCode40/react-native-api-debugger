import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import Icon from './Icon';

const CLOSE_BUTTON_SIZE = 58;

interface NonFloatingButtonProps {
  openModal: () => void;
  hideIcon: () => void;
  logsLength: number;
  enableDeviceShake?: boolean;
}

const NonFloatingButton: React.FunctionComponent<NonFloatingButtonProps> = ({
  hideIcon,
  logsLength,
  openModal,
  enableDeviceShake,
}) => {
  return (
    <>
      {enableDeviceShake && (
        <View style={[styles.floatingCloseIcon]}>
          <TouchableOpacity onPress={hideIcon} style={styles.closeButton}>
            <Icon type="close" />
          </TouchableOpacity>
        </View>
      )}
      <View style={[styles.floatingButton]}>
        <TouchableOpacity onPress={openModal} activeOpacity={0.9}>
          <Text style={styles.floatingButtonText}>📊 {logsLength}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 25,
    elevation: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1000,
  },
  floatingCloseIcon: {
    position: 'absolute',
    bottom: 150,
    right: 16,
    padding: 16,
    borderRadius: 25,
    zIndex: 1000,
  },
  floatingButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 16,
    borderRadius: 70,
    width: CLOSE_BUTTON_SIZE,
    height: CLOSE_BUTTON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: '900',
  },
});

export default NonFloatingButton;
