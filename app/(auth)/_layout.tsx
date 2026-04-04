import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function AuthLayout() {
  return (
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
  );
}
