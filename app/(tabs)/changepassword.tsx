import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { changePassword } from '../services/api';

export default function ChangePasswordScreen() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

const handleUpdate = async () => {
  // 1. Client-side Validation
  if (form.newPassword !== form.confirmPassword) {
    return Alert.alert("Error", "New passwords do not match");
  }
  
  if (form.newPassword.length < 6) {
    return Alert.alert("Error", "Password must be at least 6 characters");
  }

  setLoading(true);
  
  try {
    // 2. Call the service function
    const role = 'security';
    const data = await changePassword(form.currentPassword, form.newPassword, role);

    // 3. Handle the structured response
    if (data.success) {
      Alert.alert("Success", "Password updated successfully");
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      // This will now catch "Current password is incorrect" or other backend errors
      Alert.alert("Failed", data.message || "Could not update password");
    }
  } catch (err) {
    // This catches unexpected logic errors, though the service handles network errors
    Alert.alert("Error", "An unexpected error occurred");
  } finally {
    setLoading(false);
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Current Password</Text>
      <TextInput 
        style={styles.input} 
        secureTextEntry 
        value={form.currentPassword}
        onChangeText={(txt) => setForm({...form, currentPassword: txt})} 
      />

      <Text style={styles.label}>New Password</Text>
      <TextInput 
        style={styles.input} 
        secureTextEntry 
        value={form.newPassword}
        onChangeText={(txt) => setForm({...form, newPassword: txt})} 
      />

      <Text style={styles.label}>Confirm New Password</Text>
      <TextInput 
        style={styles.input} 
        secureTextEntry 
        value={form.confirmPassword}
        onChangeText={(txt) => setForm({...form, confirmPassword: txt})} 
      />

      <TouchableOpacity style={styles.button} onPress={handleUpdate} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Update Password</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  label: { fontSize: 14, color: '#374151', marginBottom: 5, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', padding: 12, borderRadius: 8, marginBottom: 20 },
  button: { backgroundColor: '#2563EB', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});