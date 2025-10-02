import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import React, { useEffect } from 'react';
import Icon from './Icon';
import NonFloatingButton from './NonFloatingButton';
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

let Animated: any = null;
let Reanimated: any = null;
let useSharedValue: any = null;
let useAnimatedStyle: any = null;
let withSpring: any = null;
let Gesture: any = null;
let GestureDetector: any = null;

let librariesAvailable = false;

try {
  Animated = require('react-native-reanimated').default;
  Reanimated = require('react-native-reanimated');
  useSharedValue = Reanimated.useSharedValue;
  useAnimatedStyle = Reanimated.useAnimatedStyle;
  withSpring = Reanimated.withSpring;

  const gestureHandler = require('react-native-gesture-handler');
  Gesture = gestureHandler.Gesture;
  GestureDetector = gestureHandler.GestureDetector;

  librariesAvailable = !!(
    Animated &&
    useSharedValue &&
    useAnimatedStyle &&
    withSpring &&
    Gesture &&
    GestureDetector
  );
} catch (error) {
  librariesAvailable = false;
}

const BUTTON_SIZE = 58;
const CLOSE_BUTTON_SIZE = 58;
const PADDING = 20;

interface FloatingButtonProps {
  openModal: () => void;
  hideIcon: () => void;
  logsLength: number;
  draggable?: boolean;
  enableDeviceShake?: boolean;
}

const AnimatedFloatingButton: React.FC<FloatingButtonProps> = ({
  hideIcon,
  openModal,
  logsLength,
  enableDeviceShake,
}) => {
  const positionX = useSharedValue(screenWidth - BUTTON_SIZE - PADDING);
  const positionY = useSharedValue(screenHeight - 150);
  const startPositionX = useSharedValue(0);
  const startPositionY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
      startPositionX.value = positionX.value;
      startPositionY.value = positionY.value;
    })
    .onUpdate((event: { translationX: any; translationY: any }) => {
      const newX = startPositionX.value + event.translationX;
      const newY = startPositionY.value + event.translationY;

      const minX = PADDING;
      const maxX = screenWidth - BUTTON_SIZE - PADDING;
      const minY = 50;
      const maxY = screenHeight - 150;

      positionX.value = Math.max(minX, Math.min(maxX, newX));
      positionY.value = Math.max(minY, Math.min(maxY, newY));
    })
    .onEnd(() => {
      isDragging.value = false;

      const centerX = screenWidth / 2;

      if (positionX.value < centerX) {
        positionX.value = withSpring(PADDING);
      } else {
        positionX.value = withSpring(screenWidth - BUTTON_SIZE - PADDING);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      left: positionX.value,
      top: positionY.value,
      opacity: isDragging.value ? 0.8 : 1,
    };
  });

  const animatedCloseStyle = useAnimatedStyle(() => {
    return {
      left: positionX.value + 4,
      top: positionY.value - 50,
      opacity: isDragging.value ? 0.8 : 1,
    };
  });

  return (
    <View style={styles.container}>
      {enableDeviceShake && (
        <Animated.View style={[styles.floatingCloseIcon, animatedCloseStyle]}>
          <TouchableOpacity onPress={hideIcon} style={styles.closeButton}>
            <Icon type="close" />
          </TouchableOpacity>
        </Animated.View>
      )}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.floatingButton, animatedStyle]}>
          <TouchableOpacity
            onPress={openModal}
            activeOpacity={0.9}
            style={styles.buttonTouchable}
          >
            <Text style={styles.floatingButtonText}>📊 {logsLength}</Text>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const FloatingButton: React.FC<FloatingButtonProps> = (props) => {
  const { draggable } = props;

  useEffect(() => {
    if (draggable && !librariesAvailable) {
      throw new Error(
        `Missing Libraries: Required libraries "react-native-reanimated" and "react-native-gesture-handler" are not installed. Please install them to enable this feature.\n\nRun:\n\nnpm install react-native-reanimated react-native-gesture-handler\n\nand rebuild your app.`
      );
    }
  }, [draggable]);

  if (!librariesAvailable || !draggable) {
    return <NonFloatingButton {...props} />;
  }

  return <AnimatedFloatingButton {...props} />;
};

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    position: 'absolute',
    pointerEvents: 'box-none',
  },
  container: {
    flex: 1,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    position: 'absolute',
    pointerEvents: 'box-none',
  },
  floatingButton: {
    position: 'absolute',
    zIndex: 1000,
  },
  staticPosition: {
    left: screenWidth - BUTTON_SIZE - PADDING,
    top: screenHeight - 150,
  },
  buttonTouchable: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 25,
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingCloseIcon: {
    position: 'absolute',
    zIndex: 1001,
  },
  staticClosePosition: {
    left: screenWidth - BUTTON_SIZE - PADDING + 4,
    top: screenHeight - 150 - 50,
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
  floatingButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default FloatingButton;
