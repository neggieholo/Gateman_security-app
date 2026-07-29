import React from "react";
import { View, Text } from "react-native";
import { Bell, Info, AlertTriangle, ShieldAlert, CheckCircle } from "lucide-react-native";
import { tempNotification } from "../services/interfaces";

export default function TempNotificationCard({ data }: { data: tempNotification }) {
  // Use the type field directly
  const isPending = data.type === "pending";
  const isApproved = data.type === "approve";
  const isBlocked = data.type === "block";
  const isDeclined = data.type === "decline";

  // Determine Color
  let statusColor = "#3b82f6"; // Default Blue (Pending)
  if (isApproved) statusColor = "#10b981"; // Success Green
  else if (isBlocked) statusColor = "#ef4444"; // Error Red
  else if (isDeclined) statusColor = "#f59e0b"; // Warning Orange

  // Determine Icon
  let Icon = Bell;
  if (isApproved) Icon = CheckCircle;
  else if (isBlocked) Icon = ShieldAlert;
  else if (isDeclined) Icon = AlertTriangle;

  return (
    <View 
      className="bg-white m-4 p-5 rounded-3xl shadow-sm border-l-8" 
      style={{ borderLeftColor: statusColor }}
    >
      <View className="flex-row items-center mb-2">
        <View 
          className="p-2 rounded-full mr-3" 
          style={{ backgroundColor: `${statusColor}20` }}
        >
          <Icon size={22} color={statusColor} />
        </View>
        <Text className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
          {isApproved ? "Status: Verified" : `From: ${data.from}`}
        </Text>
      </View>

      <Text className="text-lg font-bold text-gray-800 mb-1 leading-6">
        {data.message}
      </Text>

      {!isPending && (
        <View className={`mt-3 p-3 rounded-xl flex-row items-start ${isApproved ? 'bg-green-50' : 'bg-gray-50'}`}>
          <Info 
            size={16} 
            color={isApproved ? "#10b981" : "#94a3b8"} 
            style={{ marginTop: 2, marginRight: 8 }} 
          />
          <Text className={`${isApproved ? 'text-green-700' : 'text-gray-600'} text-sm italic flex-1`}>
            {isApproved 
              ? "Please log out and log back in to access your dashboard." 
              : (data.reason && data.reason.trim() !== "" ? data.reason : "No reason was given")}
          </Text>
        </View>
      )}
    </View>
  );
}