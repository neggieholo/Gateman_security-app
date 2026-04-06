import React, { useContext, useEffect } from "react";
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import NotificationCard from "./Components/NotificationCard";
import SwipeDismiss from "./Components/SwipeableNotification";
import TempNotificationCard from "./Components/TempNotificationCard";
import {
  deleteNotificationApi,
  dismissSecurityNotification,
  markAllAsReadApi,
  markSecurityNotificationRead,
} from "./services/api";
import { UserContext } from "./UserContext";

export default function NotificationsPage() {
  const {
    user,
    tempnotification,
    setTempnotification,
    notifications,
    setNotifications,
    triggerRefresh,
    setBadgeCount,
    loadingNotifications
  } = useContext(UserContext);

  useEffect(() => {
    if (user?.isTemp) {
      triggerRefresh();
    }
  }, []);

  useEffect(() => {
    const handleRead = async () => {
      console.log("HandleRead called")
      if (user?.isTemp && tempnotification) {
        setBadgeCount(0);
        await markSecurityNotificationRead();
      } else if (!user?.isTemp && notifications.length > 0) {
        await markAllAsReadApi();
        setBadgeCount(0);
      }
    };
    handleRead();
  }, [tempnotification, notifications.length]);

  const handleDelete = async (id?: string) => {
    if (user?.isTemp) {
      setTempnotification(null);
      await dismissSecurityNotification();
    } else if (id) {
      setNotifications(notifications.filter((n) => n.id !== id));
      await deleteNotificationApi(id);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={loadingNotifications} onRefresh={triggerRefresh} />
      }
    >
      <View className="p-4 flex-row justify-between items-center">
        <Text className="text-2xl font-bold text-gray-900">Notifications</Text>
        <TouchableOpacity onPress={triggerRefresh}>
          <Text className="text-blue-600 font-semibold">Refresh</Text>
        </TouchableOpacity>
      </View>

      <View className="px-2">
        {/* Render Temp Notification (Singular) */}
        {user?.isTemp && tempnotification && (
          <SwipeDismiss onDismiss={() => handleDelete()}>
            <TempNotificationCard data={tempnotification} />
          </SwipeDismiss>
        )}

        {/* Render Permanent Notifications (List) */}
        {!user?.isTemp && notifications.length > 0
          ? notifications.map((item) => (
              <SwipeDismiss
                key={item.id}
                onDismiss={() => handleDelete(item.id)}
              >
                <NotificationCard item={item} />
              </SwipeDismiss>
            ))
          : !user?.isTemp && (
              <View className="items-center mt-20 px-10">
                <Text className="text-gray-400 text-center">
                  Your notification tray is empty.
                </Text>
              </View>
            )}

        {/* Empty State for Temp Users */}
        {user?.isTemp && !tempnotification && (
          <View className="items-center mt-20 px-10">
            <Text className="text-gray-400 text-center">
              Your notification tray is empty.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
