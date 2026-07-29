import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import RNCallKeep from 'react-native-callkeep';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Usage for your test button:
// const testUUID = generateUUID();
// console.log(testUUID);

export default function TestCallButton() {
  const triggerTestCall = () => {
    const callUUID = generateUUID();
    
    RNCallKeep.displayIncomingCall(
      callUUID,
      "123456789",
      "Gate Entrance",
      "number",
      false,
      {}
    );
  };

  return (
    <View className="m-5 p-2">
      <TouchableOpacity 
        onPress={triggerTestCall}
        className="bg-purple-700 p-4 rounded-xl items-center justify-center shadow-lg"
      >
        <Text className="text-white font-bold text-lg">
          Simulate Gate Call
        </Text>
      </TouchableOpacity>
    </View>
  );
}