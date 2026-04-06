import React from "react";
import { View, Text } from "react-native";
import { 
  Bell, 
  Info, 
  ShieldAlert, 
  CheckCircle, 
  Megaphone, 
  Clock 
} from "lucide-react-native";
import { notification } from "../services/interfaces";

interface Props {
  item: notification;
}

export default function NotificationCard({ item }: Props) {
  
  // Dynamic theme based on notification type
  const getTheme = () => {
    const type = item.type?.toLowerCase();
    switch (type) {
      case "emergency":
        return { color: "#ef4444", icon: ShieldAlert, label: "Emergency" };
      case "entry":
        return { color: "#10b981", icon: CheckCircle, label: "Entry Alert" };
      case "invite":
        return { color: "#3b82f6", icon: Bell, label: "Guest Invite" };
      case "announcement":
        return { color: "#6366f1", icon: Megaphone, label: "Announcement" };
      default:
        return { color: "#94a3b8", icon: Bell, label: "Update" };
    }
  };

  const theme = getTheme();

  // Format date (e.g., "Today at 2:30 PM")
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View 
      className="bg-white mx-4 my-2 p-5 rounded-3xl shadow-sm border-l-8" 
      style={{ borderLeftColor: theme.color }}
    >
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center">
          <View 
            className="p-2 rounded-full mr-3" 
            style={{ backgroundColor: `${theme.color}20` }}
          >
            <theme.icon size={20} color={theme.color} />
          </View>
          <Text className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
            {theme.label}
          </Text>
        </View>
        
        <View className="flex-row items-center">
          <Clock size={12} color="#94a3b8" style={{ marginRight: 4 }} />
          <Text className="text-gray-400 text-[10px]">{formatDate(item.created_at)}</Text>
        </View>
      </View>

      <Text className="text-lg font-bold text-gray-800 mb-1 leading-6">
        {item.title}
      </Text>

      <View className="mt-2 p-3 rounded-xl flex-row items-start bg-gray-50">
        <Info size={16} color="#94a3b8" style={{ marginTop: 2, marginRight: 8 }} />
        <Text className="text-gray-600 text-sm flex-1 leading-5">
          {item.message}
        </Text>
      </View>
    </View>
  );
}