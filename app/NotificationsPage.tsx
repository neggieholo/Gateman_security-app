
import React, { useContext, useEffect } from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { UserContext } from "./UserContext";
import TempNotificationCard from "./Components/TempNotificationCard";
import SwipeDismiss from "./Components/SwipeableNotification";
import { markSecurityNotificationRead, dismissSecurityNotification } from "./services/api";

export default function NotificationsPage() {
  const { user, tempnotification, setTempnotification, triggerRefresh, setBadgeCount } = useContext(UserContext);

  useEffect(() => {
    
const handleMarkRead = async () => {
  if (tempnotification) {
    console.log("Read action triggered locally");
    setBadgeCount(0); 
    const result = await markSecurityNotificationRead();
    
    if (result.success) {
      console.log("✅ Server: Notification marked as read");
    } else {
      console.error("❌ Server sync failed");
    }
  }
  };

  handleMarkRead();

  },[tempnotification, setBadgeCount]);

const handleDelete = async () => {
console.log("👋 Swipe dismiss triggered");

setTempnotification(null); 

// 2. Sync with Backend
const result = await dismissSecurityNotification();

if (!result.success) {
  // Optional: If it fails, you could trigger a refresh to bring it back
  console.error("Failed to sync dismissal with server");
}
};

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4 flex-row justify-between items-center">
        <Text className="text-2xl font-bold text-gray-900">Notifications</Text>
        {user?.isTemp && (
          <TouchableOpacity onPress={triggerRefresh}>
            <Text className="text-blue-600 font-semibold">Refresh</Text>
          </TouchableOpacity>
        )}
      </View>
      
        {user?.isTemp ? (
          <View>
            {tempnotification ? (
              <SwipeDismiss onDismiss={handleDelete}>
                <TempNotificationCard data={tempnotification} />
              </SwipeDismiss>
            ) : (
              <View className="items-center justify-center mt-20 px-10">
                <Text className="text-gray-400 text-center">
                  No active requests found. Use the &quot;Join Estate&quot; option to get started.
                </Text>
              </View>
            )}
          </View>
        ) : (
          /* Regular Tenant Notifications go here */
          <View className="p-10 items-center">
            <Text className="text-gray-400 text-center">Your notification tray is empty.</Text>
          </View>
        )}
    </ScrollView>
  );
  
}