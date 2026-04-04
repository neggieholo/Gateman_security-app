import React from "react";
import { TouchableOpacity, Text, GestureResponderEvent, TouchableOpacityProps } from "react-native";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  titleClassName?: string;
}

export const Button: React.FC<ButtonProps> = ({ title, onPress, disabled = false, ...rest }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    className={`bg-white py-3 rounded-lg ${disabled ? "opacity-50" : ""}`}
    {...rest}
  >
    <Text className="text-blue-600 text-center font-bold">{title}</Text>
  </TouchableOpacity>
);
