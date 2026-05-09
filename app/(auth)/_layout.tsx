import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function AuthLayout() {
  const colorScheme = useColorScheme();

  return (
    <>
      <StatusBar
        key={`status-bar-${colorScheme}`}
        style={
          Platform.OS === "android"
            ? colorScheme === "dark"
              ? "light"
              : "dark"
            : "dark"
        }
        backgroundColor={
          Platform.OS === "android"
            ? colorScheme === "dark"
              ? "#000000"
              : "#ffffff"
            : undefined
        }
        translucent={false}
      />
      <SafeAreaProvider>
        <Stack>
          <Stack.Screen
            name="index"
            options={{
              title: "Login",
              headerShown: false,
            }}
          />

          {/* <Stack.Screen
            name="register"
            options={{
              title: "Register",
              headerShown: false,
            }}
          /> */}
        </Stack>
      </SafeAreaProvider>
    </>
  );
}
