// components/TempNotificationCard.tsx
import React from "react";
import { View, Text } from "react-native";
import { Bell, Info, AlertTriangle, ShieldAlert } from "lucide-react-native";
import { tempNotification } from "../services/interfaces";

export default function TempNotificationCard({ data }: { data: tempNotification }) {
  const isPending = data.from === "Gateman";
  
  // Logic: Blocked/Declined gets an icon, Pending gets a Bell
  const Icon = isPending ? Bell : data.message.includes("blocked") ? ShieldAlert : AlertTriangle;
  const statusColor = isPending ? "#3b82f6" : data.message.includes("blocked") ? "#ef4444" : "#f59e0b";

  return (
    <View className="bg-white m-4 p-5 rounded-3xl shadow-sm border-l-8" style={{ borderLeftColor: statusColor }}>
      <View className="flex-row items-center mb-2">
        <View className="p-2 rounded-full mr-3" style={{ backgroundColor: `${statusColor}20` }}>
          <Icon size={22} color={statusColor} />
        </View>
        <Text className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">
          From: {data.from}
        </Text>
      </View>

      <Text className="text-lg font-bold text-gray-800 mb-1">{data.message}</Text>

      {/* Logic: Omit reason if pending; show "No reason" if empty for others */}
      {!isPending && (
        <View className="mt-3 p-3 bg-gray-50 rounded-xl flex-row items-start">
          <Info size={16} color="#94a3b8" style={{ marginTop: 2, marginRight: 8 }} />
          <Text className="text-gray-600 text-sm italic flex-1">
            {data.reason && data.reason.trim() !== "" 
              ? data.reason 
              : "No reason was given"}
          </Text>
        </View>
      )}
    </View>
  );
}