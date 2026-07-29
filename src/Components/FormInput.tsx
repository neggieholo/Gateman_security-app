import React from "react";
import { TextInput, TextInputProps, View } from "react-native";

interface FormInputProps extends TextInputProps {
  placeholder: string;
  value: string;
  marginBottom?: string;
  onChangeText: (text: string) => void;
}

export const FormInput: React.FC<FormInputProps> = ({
  placeholder,
  value,
  marginBottom = "mb-4",
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  ...rest
}) => (
  <View className={`${marginBottom}`}>
    <TextInput
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      placeholderTextColor="rgba(255,255,255,0.6)"
      keyboardType={keyboardType}
      className="border border-gray-300 rounded-lg px-4 py-3 bg-black/70 text-white"
      {...rest}
    />
  </View>
);
