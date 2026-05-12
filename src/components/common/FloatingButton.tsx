import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import React, { useEffect } from 'react';
import { SvgIcon } from '../../icons';
import NonFloatingButton from './NonFloatingButton';
import { colors, getThemeColors, type ThemeMode } from '../../constants/colors';

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
const PADDING = 20;

interface FloatingButtonProps {
  openModal: () => void;
  hideIcon: () => void;
  logsLength: number;
  errorCount?: number;
  draggable?: boolean;
  enableDeviceShake?: boolean;
  theme?: ThemeMode;
}

const AnimatedFloatingButton: React.FC<FloatingButtonProps> = ({
  hideIcon,
  openModal,
  logsLength,
  errorCount = 0,
  enableDeviceShake,
  theme = 'dark',
}) => {
  const themeColors = getThemeColors(theme);
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
    .onUpdate((event: { translationX: number; translationY: number }) => {
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
            <SvgIcon name="x" size={16} color={themeColors.textMuted} />
          </TouchableOpacity>
        </Animated.View>
      )}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.floatingButton, animatedStyle]}>
          <TouchableOpacity
            onPress={openModal}
            activeOpacity={0.9}
            style={[
              styles.buttonTouchable,
              {
                backgroundColor: themeColors.surfaceContainer,
                borderColor: themeColors.border,
              },
            ]}
          >
            <SvgIcon name="barChart" size={16} color={themeColors.text} />
            <Text
              style={[styles.floatingButtonText, { color: themeColors.text }]}
            >
              {logsLength}
            </Text>
            {errorCount > 0 ? (
              <View style={styles.errorBadge}>
                <Text style={styles.errorBadgeText}>
                  {errorCount > 99 ? '99+' : errorCount}
                </Text>
              </View>
            ) : (
              <View style={styles.successBadge}>
                <SvgIcon name="check" size={10} color="#0F172A" />
              </View>
            )}
            {/* Drag handle */}
            <View style={styles.dragHandle}>
              <View
                style={[
                  styles.dragDot,
                  { backgroundColor: themeColors.textMuted },
                ]}
              />
              <View
                style={[
                  styles.dragDot,
                  { backgroundColor: themeColors.textMuted },
                ]}
              />
              <View
                style={[
                  styles.dragDot,
                  { backgroundColor: themeColors.textMuted },
                ]}
              />
            </View>
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
  buttonTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingCloseIcon: {
    position: 'absolute',
    zIndex: 1001,
  },
  closeButton: {
    padding: 8,
  },
  floatingButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.error,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#10131a',
  },
  errorBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  successBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.success,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#10131a',
  },
  dragHandle: {
    marginLeft: 4,
    opacity: 0.3,
    gap: 2,
  },
  dragDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
});

export default FloatingButton;
