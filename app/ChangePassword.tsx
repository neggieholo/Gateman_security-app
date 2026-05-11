import React, { useState } from 'react';
import * as SecureStore from "expo-secure-store";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView 
} from 'react-native';
import { changePassword } from './services/api';

export default function ChangePasswordScreen() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ 
    currentPassword: '', 
    newPassword: '', 
    confirmPassword: '' 
  });

  const handleUpdate = async () => {
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      return Alert.alert("Error", "Please fill in all fields");
    }

    if (form.newPassword !== form.confirmPassword) {
      return Alert.alert("Error", "New passwords do not match");
    }
    
    if (form.newPassword.length < 6) {
      return Alert.alert("Error", "Password must be at least 6 characters");
    }

    setLoading(true);
    
    try {
      const role = 'security';
      const data = await changePassword(form.currentPassword, form.newPassword, role);

      if (data.success) {
        await SecureStore.setItemAsync("user_password", form.newPassword);
        Alert.alert("Success", "Password updated successfully");
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
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
      className="flex-1 bg-gray-50"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-6">
        <View className="mb-8">
          <Text className="text-gray-500 mt-1">Ensure your account stays secure</Text>
        </View>

        {/* Current Password */}
        <View className="mb-5">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Current Password</Text>
          <TextInput 
            className="bg-white border border-gray-200 p-4 rounded-2xl text-gray-900 shadow-sm"
            placeholder="Enter current password"
            placeholderTextColor="#9ca3af"
            secureTextEntry 
            value={form.currentPassword}
            onChangeText={(txt) => setForm({...form, currentPassword: txt})} 
          />
        </View>

        {/* New Password */}
        <View className="mb-5">
          <Text className="text-sm font-semibold text-gray-700 mb-2">New Password</Text>
          <TextInput 
            className="bg-white border border-gray-200 p-4 rounded-2xl text-gray-900 shadow-sm"
            placeholder="Minimum 6 characters"
            placeholderTextColor="#9ca3af"
            secureTextEntry 
            value={form.newPassword}
            onChangeText={(txt) => setForm({...form, newPassword: txt})} 
          />
        </View>

        {/* Confirm Password */}
        <View className="mb-8">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Confirm New Password</Text>
          <TextInput 
            className="bg-white border border-gray-200 p-4 rounded-2xl text-gray-900 shadow-sm"
            placeholder="Repeat new password"
            placeholderTextColor="#9ca3af"
            secureTextEntry 
            value={form.confirmPassword}
            onChangeText={(txt) => setForm({...form, confirmPassword: txt})} 
          />
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          activeOpacity={0.8}
          className={`p-4 rounded-2xl items-center shadow-md ${loading ? 'bg-indigo-400' : 'bg-indigo-600'}`}
          onPress={handleUpdate} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">Update Password</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}