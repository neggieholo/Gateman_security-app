import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { UserProvider } from "./UserContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <KeyboardProvider >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ActionSheetProvider>
            <UserProvider>
              <Stack
                screenOptions={{
                  headerStyle: {
                    backgroundColor: "#2563eb",
                  },
                  headerTintColor: "#ffffff",
                  headerTitleStyle: {
                    color: "#ffffff",
                    fontWeight: "bold",
                  },
                  headerTitleAlign: "center",
                }}
              >
                <Stack.Screen
                  name="(auth)"
                  options={{
                    title: "Auth",
                    headerShown: false,
                  }}
                />

                {/* Register screen */}
                <Stack.Screen
                  name="(tabs)"
                  options={{
                    title: "Tabs",
                    headerShown: false,
                  }}
                />

                <Stack.Screen
                  name="JoinRequest"
                  options={{
                    title: "Join Estate",
                    headerShown: true,
                  }}
                />

                <Stack.Screen
                  name="NotificationsPage"
                  options={{
                    title: "Notifications",
                    headerShown: true,
                  }}
                />

                <Stack.Screen
                  name="ChatScreen"
                  options={{
                    title: "Messages",
                    headerShown: true,
                  }}
                />

                <Stack.Screen
                  name="CallScreen"
                  options={{
                    title: "Call",
                    headerShown: false,
                  }}
                />
              </Stack>
            </UserProvider>
          </ActionSheetProvider>
        </GestureHandlerRootView>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
