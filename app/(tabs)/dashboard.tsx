import * as Location from "expo-location"; // Best for Cross-platform iOS/Android
import { useRouter } from "expo-router";
import { Bell, LogIn, LogOut, ShieldCheck } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { toggleSecurityStatus } from "../services/api"; // Adjust path
import { useUser } from "../UserContext";

export default function SecurityDashboard() {
  const { user, setUser } = useUser();
  const router = useRouter();

  const [checkInCode, setCheckInCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(user?.is_on_duty || false);
  const [showBanner, setShowBanner] = React.useState(false);

  useEffect(() => {
    const welcomeShown = () => {
      if (user?.showWelcome) {
        setShowBanner(true);
      } else {
        setShowBanner(false);
      }
    };
    welcomeShown();
  }, [user]);

  const handleDismissWelcome = () => {
    setShowBanner(false);
    // Update context state so it doesn't reappear until the next "first login" event
    if (user) {
      setUser({ ...user, showWelcome: false });
    }
  };

  // Function to get current location with permissions
  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Location access is required for security check-in.",
      );
      return null;
    }

    let location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: location.timestamp,
    };
  };

  const handleCheckAction = async () => {
    // 1. Validate Input
    if (!isCheckedIn && (!checkInCode || checkInCode.length !== 10)) {
      Alert.alert("Invalid Code", "Please enter the 10-digit check-in code.");
      return;
    }

    setLoading(true);

    try {
      // 2. Get Location First
      const location = await getLocation();
      if (!location) {
        setLoading(false);
        return;
      }

      const result = await toggleSecurityStatus(checkInCode, location);

      if (result.success) {
        setIsCheckedIn(result.isOnDuty);
        if (result.isOnDuty) setCheckInCode(""); // Clear on success
        Alert.alert(
          "Success",
          result.isOnDuty
            ? "Checked in successfully"
            : "Checked out successfully",
        );
      } else {
        Alert.alert("Denied", result.error || "Verification failed");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to connect to GateMan server.");
    } finally {
      setLoading(false);
    }
  };

  // --- Handle No Estate Joined View ---
  if (!user?.estate_id) {
    return (
      <View className="flex-1 justify-center items-center p-6 bg-gray-50">
        <View className="bg-white p-8 rounded-3xl shadow-sm items-center border border-gray-100">
          <ShieldCheck size={60} color="#4f46e5" />
          <Text className="text-xl font-bold text-gray-900 mt-4 text-center">
            Security Access Restricted
          </Text>
          <TouchableOpacity
            className="bg-indigo-600 py-4 px-10 rounded-2xl shadow-md mt-6"
            onPress={() => router.push("/JoinRequest" as any)}
          >
            <Text className="text-white font-bold text-lg">Join an Estate</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 p-6 justify-center">
      <Modal
        animationType="fade"
        transparent={true}
        visible={showBanner}
        onRequestClose={handleDismissWelcome}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-sky-50 rounded-3xl p-6 shadow-2xl border border-sky-100 w-full">
            <View className="items-center mb-4">
              <View className="bg-sky-500 p-3 rounded-full mb-4">
                <Bell size={30} color="white" />
              </View>
              <Text className="text-gray-900 font-black text-2xl text-center mb-2">
                Welcome to {user.estate_name || "the Estate"}! 🎉
              </Text>
              <Text className="text-gray-600 text-center leading-5 px-2">
                Your join request has been approved. Stay updated.
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleDismissWelcome}
              className="bg-indigo-600 py-4 rounded-xl shadow-md shadow-indigo-300 active:bg-indigo-700"
            >
              <Text className="text-white text-center font-bold text-lg">
                Get Started
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <Text className="text-gray-400 font-bold mb-2 uppercase tracking-widest text-[10px]">
          Duty Status: {isCheckedIn ? "On Duty" : "Off Duty"}
        </Text>

        <Text className="text-2xl font-bold text-gray-900 mb-6">
          {isCheckedIn ? "Active Shift" : "Security Check-In"}
        </Text>

        <TextInput
          placeholder="Enter 10-digit Code"
          value={checkInCode}
          onChangeText={(val) =>
            setCheckInCode(val.replace(/[^0-9]/g, "").slice(0, 10))
          }
          editable={!isCheckedIn}
          keyboardType="number-pad"
          className={`w-full h-14 px-4 rounded-xl border text-lg font-mono mb-4 ${
            isCheckedIn
              ? "bg-gray-100 border-gray-200 text-gray-400"
              : "bg-white border-gray-300 text-indigo-600"
          }`}
        />

        <TouchableOpacity
          onPress={handleCheckAction}
          disabled={loading}
          className={`w-full h-16 rounded-2xl flex-row items-center justify-center ${
            isCheckedIn ? "bg-red-500" : "bg-indigo-600"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              {isCheckedIn ? (
                <LogOut color="white" size={20} />
              ) : (
                <LogIn color="white" size={20} />
              )}
              <Text className="text-white font-bold text-lg ml-2">
                {isCheckedIn ? "End Shift" : "Start Shift"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
