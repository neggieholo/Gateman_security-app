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
    // CRITICAL: Only activate the swipe if moving horizontally more than 10px
    // This allows vertical touches to pass through to the ScrollView
    .activeOffsetX([-10, 10]) 
    .onUpdate((event) => {
      if (event.translationX > 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(SCREEN_WIDTH, { duration: 300 }, () => {
          runOnJS(onDismiss)();
        });
      } else {
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