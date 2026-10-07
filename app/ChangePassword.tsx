/* eslint-disable @typescript-eslint/no-unused-vars */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { changePassword } from "../src/services/api";
import { useUser } from "./UserContext";

export default function ChangePasswordScreen() {
  const { user, setUser, isDarkMode, setShowBiometricBtn } = useUser();
  const router = useRouter();
  const { mandatory } = useLocalSearchParams();
  const isMandatory = mandatory === "true";

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleUpdate = async () => {
    // Current password is only required for voluntary password updates
    if (!isMandatory && !form.currentPassword) {
      return Alert.alert("Error", "Please enter your current password");
    }

    if (form.newPassword !== form.confirmPassword) {
      return Alert.alert("Error", "New passwords do not match");
    }

    if (form.newPassword.length < 6) {
      return Alert.alert("Error", "Password must be at least 6 characters");
    }

    setLoading(true);

    try {
      const role = user?.isTemp ? "temp_security" : "security";

      // Pass empty string for currentPassword if mandatory reset, or form.currentPassword if normal
      const data = await changePassword(
        isMandatory ? "" : form.currentPassword,
        form.newPassword,
        role,
        Boolean(isMandatory),
      );

      if (data.success) {
        await SecureStore.setItemAsync("user_password", form.newPassword);

        if (isMandatory) {
          Alert.alert(
            "Success",
            "Password updated successfully. Proceeding to dashboard.",
            [{ text: "OK", onPress: () => router.replace("/dashboard") }],
          );
          setUser({
            ...user,
            isTempPassword: false,
          });
          if (user?.biometric_login) {
            await AsyncStorage.setItem("biometrics_active", "true");
            setShowBiometricBtn(true);
          }
        } else {
          Alert.alert("Success", "Password updated successfully");
          setForm({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
        }
      } else {
        Alert.alert("Failed", data.message || "Could not update password");
      }
    } catch (err) {
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className={`flex-1 ${isDarkMode ? "bg-slate-950" : "bg-gray-50 "}`}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className={`p-6 ${isDarkMode ? "bg-gm-navy/20" : "bg-gray-50"}`}
      >
        {/* MANDATORY WARNING BANNER */}
        {isMandatory ? (
          <View className="mb-6 bg-amber-500/15 border border-amber-500 p-4 rounded-2xl">
            <Text className="text-amber-600 font-montserrat-bold text-base mb-1">
              Set Your New Password
            </Text>
            <Text className="text-amber-700 font-roboto-regular text-sm">
              You logged in with a temporary password. Please choose a new
              permanent password to continue.
            </Text>
          </View>
        ) : (
          <View className="mb-8">
            <Text
              className={`${isDarkMode ? "text-gm-gold" : "text-gray-500"} mt-1 font-oswald-semibold text-lg`}
            >
              Ensure your account stays secure
            </Text>
          </View>
        )}

        {/* Current Password - ONLY SHOWN IF NOT MANDATORY RESET */}
        {!isMandatory && (
          <View className="mb-5">
            <Text
              className={`text-sm font-oswald-semibold ${isDarkMode ? "text-gm-white" : "text-gray-700"} mb-2`}
            >
              Current Password
            </Text>
            <TextInput
              className={`${isDarkMode ? "bg-gm-navy border-gm-gold text-white" : "bg-white border border-gray-200 text-gray-900"} p-4 rounded-2xl font-roboto-regular`}
              placeholder="Enter current password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              value={form.currentPassword}
              onChangeText={(txt) => setForm({ ...form, currentPassword: txt })}
            />
          </View>
        )}

        {/* New Password */}
        <View className="mb-5">
          <Text
            className={`text-sm font-oswald-semibold ${isDarkMode ? "text-gm-white" : "text-gray-700"} mb-2`}
          >
            New Password
          </Text>
          <TextInput
            className={`${isDarkMode ? "bg-gm-navy border-gm-gold text-white" : "bg-white border border-gray-200 text-gray-900"} p-4 rounded-2xl font-roboto-regular`}
            placeholder="Minimum 6 characters"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={form.newPassword}
            onChangeText={(txt) => setForm({ ...form, newPassword: txt })}
          />
        </View>

        {/* Confirm Password */}
        <View className="mb-8">
          <Text
            className={`text-sm font-oswald-semibold ${isDarkMode ? "text-gm-white" : "text-gray-700"} mb-2`}
          >
            Confirm New Password
          </Text>
          <TextInput
            className={`${isDarkMode ? "bg-gm-navy border-gm-gold text-white" : "bg-white border border-gray-200 text-gray-900"} p-4 rounded-2xl font-roboto-regular`}
            placeholder="Repeat new password"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={form.confirmPassword}
            onChangeText={(txt) => setForm({ ...form, confirmPassword: txt })}
          />
        </View>

        {/* Action Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          className={`p-4 rounded-2xl items-center ${isDarkMode ? "bg-gm-charcoal" : "bg-gm-navy"}`}
          onPress={handleUpdate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-montserrat-bold text-lg">
              {isMandatory ? "Set Password & Continue" : "Update Password"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
