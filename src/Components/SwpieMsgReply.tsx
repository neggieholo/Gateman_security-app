import React from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  runOnJS 
} from 'react-native-reanimated';

const SWIPE_THRESHOLD = 50; 
const MAX_TRANSLATE = 70;

export default function SwipeReply({ children, onReply }: { children: React.ReactNode, onReply: () => void }) {
  const translateX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Only allow swiping to the right
      if (event.translationX > 0) {
        // Add resistance: as it moves further, it moves slower
        translateX.value = Math.min(event.translationX, MAX_TRANSLATE);
      }
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        // Trigger the reply function
        runOnJS(onReply)();
      }
      
      // Always snap back to 0 with a "spring" for a premium feel
      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Reanimated.View style={animatedStyle}>
        {children}
      </Reanimated.View>
    </GestureDetector>
  );
}