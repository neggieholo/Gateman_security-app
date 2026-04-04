import { postLogout } from "@/app/services/api";
import { useUser } from "@/app/UserContext";
import { Ionicons } from "@expo/vector-icons";
import CookieManager from "@react-native-cookies/cookies";
import auth from "@react-native-firebase/auth";
import { Tabs, useRouter } from "expo-router";
import { Bell } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function SecurityTabsLayout() {
  const { user, setUser, setSessionId, socket, badgeCount } = useUser();
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      if (socket) socket.disconnect();
      if (auth().currentUser) await auth().signOut();
      try {
        await postLogout();
      } catch (apiErr) {
        console.warn("Backend logout failed", apiErr);
      }
      await CookieManager.clearAll();
      if (setSessionId) setSessionId("");
      setUser(null);
      router.replace("/");
    } catch (e) {
      console.error("Logout failed", e);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <SafeAreaProvider>
      <Tabs
        initialRouteName="dashboard"
        screenOptions={{
          headerStyle: { backgroundColor: "#2563EB" },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "bold" },
          headerTitleAlign: "center",
          tabBarStyle: { backgroundColor: "#2563EB", borderTopWidth: 0 },
          tabBarActiveTintColor: "#FFFFFF",
          tabBarInactiveTintColor: "#BFDBFE",
          // The magic happens here: Both icons in the header
          headerRight: () => (
            <View className="flex-row gap-7 m-2">
              <TouchableOpacity
                onPress={() => router.push("/NotificationsPage")}
              >
                <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
                {badgeCount > 0 && (
                  <View
                    className="absolute -top-1 -right-1 bg-red-500 rounded-full flex items-center justify-center border-2 border-[#2563eb]"
                    style={{ minWidth: 18, height: 18 }}
                  >
                    <Text className="text-white text-[9px] font-bold">
                      {badgeCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          ),
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            headerTitle: "",
            headerLeft: () => (
              <View style={{ marginLeft: 15 }}>
                <Text
                  style={{ color: "white", fontSize: 18, fontWeight: "600" }}
                >
                  Hi, {user?.name || "Security"}
                </Text>
              </View>
            ),
            tabBarLabel: "Dashboard",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="grid" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="colleagues"
          options={{
            title: "Colleagues",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="shield-checkmark" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="guests"
          options={{
            title: "Guests",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="changepassword"
          options={{
            title: "Change Password",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="key" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
}
