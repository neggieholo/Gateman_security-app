import { useUser } from "@/app/UserContext";
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
  const { user, isDarkMode, contextEstateId, setContextEstateId } = useUser();
  const [showEstatePicker, setShowEstatePicker] = React.useState(false);

  if (!isOpen) return null;

  const estates = user?.estates || [];
  const hasMultipleEstates = estates.length > 1;

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

          {/* Multi-Estate Switcher (If > 1 Estate exists) */}
          {hasMultipleEstates && (
            <View className="w-full mt-6 pt-4 border-t border-slate-200/20">
              <View className="flex-row items-center mb-2">
                <Building2
                  size={13}
                  color={isDarkMode ? "#94a3b8" : "#94a3b8"}
                />
                <Text
                  className={`text-[11px] font-bold uppercase tracking-wider ml-1.5 ${
                    isDarkMode ? "text-slate-400" : "text-slate-400"
                  }`}
                >
                  Switch to Another Estate
                </Text>
              </View>

              {/* Custom Selector Trigger */}
              <TouchableOpacity
                onPress={() => setShowEstatePicker(!showEstatePicker)}
                activeOpacity={0.7}
                className={`w-full p-3.5 rounded-xl border flex-row items-center justify-between ${
                  isDarkMode
                    ? "bg-slate-900 border-slate-800"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    isDarkMode ? "text-slate-200" : "text-slate-800"
                  }`}
                >
                  {activeEstate?.estate_name} (Expired)
                </Text>
                <ChevronDown size={16} color="#94a3b8" />
              </TouchableOpacity>

              {/* Estate Options Dropdown */}
              {showEstatePicker && (
                <View
                  className={`w-full mt-2 rounded-xl border overflow-hidden ${
                    isDarkMode
                      ? "bg-slate-900 border-slate-800"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  {estates.map((est: any) => {
                    const isSelected = est.id === contextEstateId;
                    return (
                      <TouchableOpacity
                        key={est.id}
                        onPress={() => {
                          setContextEstateId(est.id);
                          setShowEstatePicker(false);
                        }}
                        className={`p-3 border-b last:border-b-0 ${
                          isDarkMode
                            ? "border-slate-800/60"
                            : "border-slate-200/60"
                        } ${isSelected ? "bg-indigo-600/10" : ""}`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            isSelected
                              ? "text-indigo-500 font-bold"
                              : isDarkMode
                              ? "text-slate-300"
                              : "text-slate-700"
                          }`}
                        >
                          {est.estate_name}{" "}
                          {est.id === activeEstate?.id ? "(Expired)" : ""}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};