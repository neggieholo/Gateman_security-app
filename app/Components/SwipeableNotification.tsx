import React from 'react';
import { Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  runOnJS 
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3; // Dismiss after swiping 30% of screen

export default function SwipeDismiss({ children, onDismiss }: { children: React.ReactNode, onDismiss: () => void }) {
  const translateX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Only allow swiping to the right (positive X)
      if (event.translationX > 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        // Slide off screen to the right
        translateX.value = withTiming(SCREEN_WIDTH, { duration: 300 }, () => {
          runOnJS(onDismiss)();
        });
      } else {
        // Snap back to original position
        translateX.value = withTiming(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    // Optional: Fade out as it moves
    opacity: 1 - (translateX.value / SCREEN_WIDTH),
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Reanimated.View style={animatedStyle}>
        {children}
      </Reanimated.View>
    </GestureDetector>
  );
}