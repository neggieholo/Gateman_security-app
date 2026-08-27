import React from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface NoModuleAccessModalProps {
  isOpen: boolean;
  estateName: string;
  onClose: () => void;
}

export const NoModuleAccessModal: React.FC<NoModuleAccessModalProps> = ({
  isOpen,
  estateName,
  onClose,
}) => {
  return (
    <Modal visible={isOpen} transparent animationType="fade">
      <View className="flex-1 bg-black/60 justify-center items-center px-5">
        <View className="w-full bg-white rounded-2xl p-6 items-center shadow-lg">
          <View className="w-18 h-18 rounded-full bg-red-100 justify-center items-center mb-4">
            <Ionicons name="shield-outline" size={48} color="#EF4444" />
          </View>

          <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
            Module Not Included
          </Text>

          <Text className="text-sm text-gray-700 text-center mb-2 leading-5">
            <Text className="font-bold">{estateName}</Text>'s current plan does not include the Security module.
          </Text>

          <Text className="text-xs text-gray-500 text-center mb-5 leading-4.5">
            Please contact your estate administrator to upgrade their subscription plan to re-enable security features.
          </Text>

          <TouchableOpacity
            className="w-full bg-gray-900 py-3 rounded-lg items-center active:opacity-90"
            onPress={onClose}
          >
            <Text className="text-white text-base font-semibold">
              Acknowledge
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};