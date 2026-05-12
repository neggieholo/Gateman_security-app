import * as Location from "expo-location"; // Best for Cross-platform iOS/Android
import { useRouter } from "expo-router";
import { Bell, LogIn, LogOut, MapPin, ShieldCheck } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getDashboardStats,
  toggleSecurityStatus,
  updateSecurityLocation,
} from "../services/api"; // Adjust path
import { useUser } from "../UserContext";

export default function SecurityDashboard() {
  const { user, setUser } = useUser();
  const router = useRouter();

  const [checkInCode, setCheckInCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(user?.is_on_duty || false);
  const [showBanner, setShowBanner] = React.useState(false);
  const [updatingLoc, setUpdatingLoc] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState<boolean>(false);
  const [stats, setStats] = useState({
    total_expected: 0,
    checked_in: 0,
    checked_out: 0,
    overstayed: 0,
    active_events: 0,
  });

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

  const fetchStats = async () => {
    try {
      const data = await getDashboardStats();
      if (data.success) setStats(data.stats);
    } catch (err) {
      console.log("Stats fetch error");
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user, refreshTrigger]);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setRefreshTrigger((prev) => !prev);
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

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

  const handleSendLocation = async () => {
    setUpdatingLoc(true);
    try {
      // 1. Get coordinates using your existing getLocation() logic
      const location = await getLocation();
      if (!location) return;

      // 2. Call the new API service
      const result = await updateSecurityLocation(
        location.latitude,
        location.longitude,
      );

      if (result.success) {
        Alert.alert(
          "Location Synced",
          "Your current position has been updated on the admin dashboard.",
        );
      } else {
        Alert.alert("Sync Failed", result.message);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to reach the server.");
    } finally {
      setUpdatingLoc(false);
    }
  };

  // --- Handle No Estate Joined View ---
  if (!user?.estate_id) {
    return (
      <View className="flex-1 justify-center items-center p-6 bg-gm-white">
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
    <ScrollView
      className="flex-1 bg-gm-navy/20 px-6 pt-6"
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#4f46e5"]}
          tintColor="#4f46e5"
        />
      }
    >
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

      {/* SECTION 1: ESTATE OVERVIEW */}
      <View className="mb-8">
        <Text className="text-gm-navy font-bold text-xs uppercase tracking-widest mb-4">
          Guest Traffic Today
        </Text>

        {/* Row 1 */}
        <View className="flex-row mb-2">
          <View className="bg-white p-3 rounded-3xl shadow-sm border border-gm-navy flex-1 mr-2 items-center">
            <Text className="text-blue-600 text-xl font-black">
              {stats.total_expected}
            </Text>
            <Text className="text-gray-500 text-[9px] font-bold uppercase mt-1">
              Expected Today
            </Text>
          </View>
          <View className="bg-white p-3 rounded-3xl shadow-sm border border-gm-navy flex-1 items-center">
            <Text className="text-emerald-600 text-xl font-black">
              {stats.checked_in}
            </Text>
            <Text className="text-gray-500 text-[9px] font-bold uppercase mt-1">
              Checked In
            </Text>
          </View>
        </View>

        {/* Row 2 */}
        <View className="flex-row">
          <View className="bg-white p-3 rounded-3xl shadow-sm border border-gm-navy flex-1 mr-2 items-center">
            <Text className="text-orange-500 text-xl font-black">
              {stats.checked_out}
            </Text>
            <Text className="text-gray-500 text-[9px] font-bold uppercase mt-1">
              Checked Out
            </Text>
          </View>
          <View className="bg-white p-3 rounded-3xl shadow-sm border border-gm-navy flex-1 items-center">
            <Text className="text-red-600 text-xl font-black">
              {stats.overstayed}
            </Text>
            <Text className="text-red-400 text-[9px] font-bold uppercase mt-1">
              Overstayed
            </Text>
          </View>
        </View>
      </View>

      {/* SECTION 2: SHIFT MANAGEMENT */}
      <View className="mb-8 flex-1 justify-center">
        <Text className="text-gm-navy font-bold text-xs uppercase tracking-widest mb-4">
          Shift Control
        </Text>
        <View className="bg-white p-6 rounded-3xl shadow-sm border border-gm-navy">
          <View className="flex-row gap-2 items-center mb-2">
            <Text className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Duty Status:</Text>
            <Text
              className={`font-bold uppercase tracking-widest text-[10px] ${isCheckedIn ? "text-green-400" : "text-red-400"}`}
            >
              {isCheckedIn ? "On Duty" : "Off Duty"}
            </Text>
          </View>

          <Text className="text-lg font-bold text-gray-900 mb-6">
            {isCheckedIn ? "Checked-In" : "Check-In"}
          </Text>

          <TextInput
            placeholder="Enter 10-digit Code"
            placeholderTextColor={"#9CA3AF"}
            value={checkInCode}
            onChangeText={(val) =>
              setCheckInCode(val.replace(/[^0-9]/g, "").slice(0, 10))
            }
            editable={!isCheckedIn}
            keyboardType="number-pad"
            className={`w-full h-10 px-4 rounded-xl border text-sm font-mono mb-4 border-gm-gold ${
              isCheckedIn
                ? "bg-gray-100 text-gray-400"
                : "bg-white text-gm-navy"
            }`}
          />

          <TouchableOpacity
            onPress={handleCheckAction}
            disabled={loading}
            className={`w-full h-10 rounded-2xl flex-row items-center justify-center ${
              isCheckedIn ? "bg-red-500" : "bg-gm-navy"
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
                <Text className={`font-bold text-lg ml-2 ${isCheckedIn ? "text-white" : "text-gm-gold"}`}>
                  {isCheckedIn ? "End Shift" : "Start Shift"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {isCheckedIn && (
            <TouchableOpacity
              onPress={handleSendLocation}
              disabled={updatingLoc}
              className="w-full h-10 mt-4 rounded-2xl border border-indigo-100 bg-gm-navy flex-row items-center justify-center active:bg-indigo-100"
            >
              {updatingLoc ? (
                <ActivityIndicator color="#4f46e5" />
              ) : (
                <>
                  <MapPin color="#D4AF37" size={20} />
                  <Text className="text-gm-gold font-bold ml-2 text-base">
                    Send Live Location
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* SECTION 3: DAILY EVENTS */}
      <View className="mb-4">
        <Text className="text-gm-charcoal font-bold text-xs uppercase tracking-widest mb-4">
          Today&apos;s Event(s)
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/events")}
          className="bg-gm-charcoal p-6 rounded-[30px] shadow-xl flex-row items-center justify-between"
        >
          <View className="flex-row items-center">
            <View className="bg-gm-gold w-12 h-12 rounded-2xl items-center justify-center mr-4">
              <Bell size={24} color="white" />
            </View>
            <View>
              <Text className="text-white text-lg font-bold">
                {stats.active_events.toString()} Active Event(s)
              </Text>
              <Text className="text-gray-400 text-xs">
                Manage guest access codes
              </Text>
            </View>
          </View>
          <ShieldCheck color="#D4AF37" size={28} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
