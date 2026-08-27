import { useUser } from "../../app/UserContext";
import { AlertTriangle, Building2, ChevronDown } from "lucide-react-native";
import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";

interface ExpiredSubscriptionModalProps {
  isOpen: boolean;
  activeEstate: any;
  onClose?: () => void;
}

export const ExpiredSubscriptionModal: React.FC<
  ExpiredSubscriptionModalProps
> = ({ isOpen, activeEstate, onClose }) => {
  const { user, isDarkMode } = useUser();

  if (!isOpen) return null;


  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <View className="flex-1 justify-center items-center p-6 bg-slate-950/80">
        {/* Modal Container */}
        <View
          className={`w-full max-w-md p-6 sm:p-8 rounded-[2.5rem] shadow-2xl border items-center ${
            isDarkMode
              ? "bg-gm-navy border-gm-gold"
              : "bg-white border-slate-100"
          }`}
        >
          {/* Warning Icon Badge */}
          <View className="w-16 h-16 rounded-3xl bg-rose-500/15 justify-center items-center mb-5">
            <AlertTriangle size={32} color="#e11d48" />
          </View>

          {/* Title & Estate Name */}
          <Text
            className={`text-xl sm:text-2xl font-bold ${
              isDarkMode ? "text-gm-gold" : "text-gm-navy"
            } font-oswald-semibold text-center`}
          >
            Subscription Expired
          </Text>
          <Text
            className={`text-xs sm:text-sm font-medium mt-1 ${
              isDarkMode ? "text-slate-400" : "text-slate-500"
            } font-roboto-regular text-center`}
          >
            {activeEstate?.estate_name || "Selected Estate"}
          </Text>

          {/* Informational Body */}
          <View
            className={`w-full mt-4 p-4 rounded-2xl border ${
              isDarkMode
                ? "bg-rose-950/30 border-rose-900/50"
                : "bg-rose-50/60 border-rose-100"
            }`}
          >
            <Text
              className={`text-xs leading-relaxed ${
                isDarkMode ? "text-slate-300" : "text-slate-600"
              } font-roboto-regular`}
            >
              Access to management feature modules for{" "}
              <Text
                className={`font-bold ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                {activeEstate?.estate_name || "this estate"}
              </Text>{" "}
              is currently locked because the active subscription billing cycle
              has ended.
            </Text>
          </View>

        </View>
      </View>
    </Modal>
  );
};