import { LocationState } from "@/services/interfaces";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import {
  Bell,
  Camera as CameraIcon,
  LogIn,
  LogOut,
  MapPin,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LivenessCameraModal from "../../src/Components/LivenessCameraModal";
import {
  cleanupLocalFile,
  getDashboardStats,
  getS3UploadedUrl,
  toggleSecurityStatus,
  updateSecurityLocation,
} from "../../src/services/api";
import { useUser } from "../UserContext";
import * as LocationModule from "../../modules/location-module/src/LocationModule";

export default function SecurityDashboard() {
  const { user, setUser, isDarkMode, theme, sendLocation } = useUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(user?.is_on_duty || false);
  const [showBanner, setShowBanner] = React.useState(false);
  const [updatingLoc, setUpdatingLoc] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [captureField, setCaptureField] = useState<"check" | "location" | null>(
    null,
  );

  // Kiosk Liveness Modal state
  const [showCameraModal, setShowCameraModal] = useState(false);

  const [stats, setStats] = useState({
    total_expected: 0,
    checked_in: 0,
    checked_out: 0,
    overstayed: 0,
    active_bookings: 0,
  });

  useEffect(() => {
    if (user?.showWelcome) {
      setShowBanner(true);
    } else {
      setShowBanner(false);
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const data = await getDashboardStats();
      if (data.success) {
        setStats(data.stats);
        console.log(data.stats);
      }
    } catch (err) {
      console.log("Stats fetch error");
    }
  };

  useEffect(() => {
    if (user?.estate_id) {
      fetchStats();
    }
  }, [user?.estate_id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const startTrackingSafely = async () => {
      console.log("Checking permissions...");

      const serviceEnabled = await Location.hasServicesEnabledAsync();
      if (!serviceEnabled) {
        try {
          // This triggers the native Android popup to turn on Location
          await Location.enableNetworkProviderAsync();
        } catch (error: any) {
          console.log("User refused to enable location services");
          return; // Stop if they won't turn it on
        }
      }
      const ignored = await LocationModule.isBatteryOptimizationIgnored();

      const { status: fgStatus } =
        await Location.requestForegroundPermissionsAsync();

      if (fgStatus === "granted") {
        await Location.requestBackgroundPermissionsAsync();

        console.log("Permissions granted, starting native module...");
        if (!ignored) {
          try {
            LocationModule.requestBatteryOptimization();
          } catch (e) {
            console.log("Battery setting popup skipped or failed", e);
          }
        }
        try {
          LocationModule.startTracking();
        } catch (e) {
          console.error("Failed to start native tracking", e);
        }
      }
    };

    startTrackingSafely();

    // 3. LISTEN for the updates coming from Kotlin
    const subscription = LocationModule.addLocationListener(
      (data: LocationState) => {
        sendLocation(data);
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDismissWelcome = () => {
    setShowBanner(false);
    if (user) {
      setUser({ ...user, showWelcome: false });
    }
  };

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

  // Execution engine for shift toggling (supports code or photo uri)
  const submitShiftToggle = async (photoUri?: string) => {
    setLoading(true);

    try {
      const location = await getLocation();
      if (!location) {
        setLoading(false);
        return;
      }

      // Sends checkInCode OR photoUri to backend
      const result = await toggleSecurityStatus(location, photoUri);

      if (result.success) {
        setIsCheckedIn(result.isOnDuty);
        Alert.alert(
          "Success",
          result.isOnDuty
            ? "Checked in successfully"
            : "Checked out successfully",
        );
        setUser({ ...user, is_on_duty: result.isOnDuty });
      } else {
        Alert.alert("Denied", result.error || "Verification failed");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to connect to GateMan server.");
    } finally {
      setLoading(false);
      setSelfie(null);
    }
  };

  const handleCheckAction = async () => {
    if (!selfie || captureField !== "check") {
      Alert.alert(
        "Liveness Required",
        "Please complete liveness verification first.",
      );
      return;
    }

    setUploadingImage(true);
    try {
      // 1. Upload local file to S3 only now
      const cloudUrl = await getS3UploadedUrl(selfie, "security_selfies");

      if (!cloudUrl) {
        Alert.alert("Upload Error", "Failed to secure image asset path.");
        return;
      }

      // 2. Submit S3 URL to backend
      await submitShiftToggle(cloudUrl);

      // 3. Clean up phone storage & reset state on success
      await cleanupLocalFile(selfie);
      setSelfie(null);
      setCaptureField(null);
    } catch (err) {
      Alert.alert("Error", "Could not complete shift check-in.");
    } finally {
      setUploadingImage(false);
    }
  };

  const triggerCameraFor = (field: "check" | "location") => {
    setCaptureField(field);
    setShowCameraModal(true);
  };

  const handleLivenessSuccess = async (photoUri: string) => {
    setShowCameraModal(false);

    if (photoUri) {
      setSelfie(photoUri); // Store local path for instant image preview!
    } else {
      Alert.alert("Upload Error", "Failed to capture image path.");
      setCaptureField(null);
    }
  };

  const handleSendLocation = async () => {
    if (!selfie || captureField !== "location") {
      Alert.alert(
        "Liveness Required",
        "Please take a verification photo to send your location.",
      );
      return;
    }

    setUpdatingLoc(true);
    try {
      const location = await getLocation();
      if (!location) return;

      // 1. Upload local file to S3
      const cloudUrl = await getS3UploadedUrl(selfie, "security_selfies");
      if (!cloudUrl) {
        Alert.alert("Upload Error", "Failed to upload verification photo.");
        return;
      }

      // 2. Send location + cloudUrl to backend
      const result = await updateSecurityLocation(
        location.latitude,
        location.longitude,
        cloudUrl,
      );

      if (result.success) {
        Alert.alert(
          "Location Synced",
          "Your current position has been updated on the admin dashboard.",
        );

        // 3. Purge local cache photo from phone
        await cleanupLocalFile(selfie);
        setSelfie(null);
        setCaptureField(null);
      } else {
        Alert.alert(
          "Sync Failed",
          result.message || "Could not update location.",
        );
      }
    } catch (err) {
      Alert.alert("Error", "Failed to reach the server.");
    } finally {
      setUpdatingLoc(false);
    }
  };

  if (!user?.estate_id) {
    return (
      <View
        className={`${isDarkMode ? "bg-slate-950" : "bg-gray-50"} flex-1 justify-center items-center p-6`}
      >
        <View
          className={`${isDarkMode ? "bg-gm-navy" : "bg-white"} p-8 rounded-3xl shadow-sm items-center border border-gray-100`}
        >
          <ShieldCheck size={60} color="#4f46e5" />
          <Text
            className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gm-navy"} mt-4 text-center`}
          >
            Security Access Restricted
          </Text>
          <TouchableOpacity
            className={`${isDarkMode ? "bg-gm-charcoal" : "bg-gm-navy "} py-4 px-10 rounded-2xl shadow-md mt-6`}
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
      className={`flex-1 ${isDarkMode ? "bg-slate-950" : "bg-gray-50 "} px-6 pt-6 pb-12`}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 10 }}
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
                Welcome to {user?.estate?.name || "the Estate"}! 🎉
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

      {/* Liveness Camera Modal for SHARED_KIOSK */}
      <LivenessCameraModal
        visible={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onLivenessSuccess={handleLivenessSuccess}
      />

      {/* SECTION 1: ESTATE OVERVIEW */}
      <View className="mb-8">
        <Text
          className={`text-lg font-oswald-semibold ${isDarkMode ? "text-gray-300" : "text-gm-navy"}`}
        >
          Guest Traffic Today
        </Text>

        <View className="flex-row mb-2">
          <View
            className={`${isDarkMode ? "bg-gm-navy border-gm-navy" : "bg-white border-gray-100"} p-3 rounded-3xl shadow-sm border flex-1 mr-2 items-center`}
          >
            <Text className="text-blue-600 text-xl font-black">
              {stats.total_expected}
            </Text>
            <Text className="text-gray-500 text-[9px] font-roboto-regular uppercase mt-1">
              Expected Today
            </Text>
          </View>
          <View
            className={`${isDarkMode ? "bg-gm-navy border-gm-navy" : "bg-white border-gray-100"} p-3 rounded-3xl shadow-sm border flex-1 items-center`}
          >
            <Text className="text-emerald-600 text-xl font-black">
              {stats.checked_in}
            </Text>
            <Text className="text-gray-500 text-[9px] font-roboto-regular uppercase mt-1">
              Checked In
            </Text>
          </View>
        </View>

        <View className="flex-row">
          <View
            className={`${isDarkMode ? "bg-gm-navy border-gm-navy" : "bg-white border-gray-100"} p-3 rounded-3xl shadow-sm border flex-1 mr-2 items-center`}
          >
            <Text className="text-orange-500 text-xl font-black">
              {stats.checked_out}
            </Text>
            <Text className="text-gray-500 text-[9px] font-roboto-regular uppercase mt-1">
              Checked Out
            </Text>
          </View>
          <View
            className={`${isDarkMode ? "bg-gm-navy border-gm-navy" : "bg-white border-gray-100"} p-3 rounded-3xl shadow-sm border flex-1 items-center`}
          >
            <Text className="text-red-600 text-xl font-black">
              {stats.overstayed}
            </Text>
            <Text className="text-red-400 text-[9px] font-roboto-regular uppercase mt-1">
              Overstayed
            </Text>
          </View>
        </View>
      </View>

      {/* SECTION 2: SHIFT MANAGEMENT */}
      {/* SECTION 2: SHIFT MANAGEMENT */}
      <View className="mb-8 flex-1 justify-center">
        <Text
          className={`text-lg font-oswald-semibold ${isDarkMode ? "text-gray-300" : "text-gm-navy"}`}
        >
          Shift Control
        </Text>
        <View
          className={`${isDarkMode ? "bg-gm-navy border-gm-navy" : "bg-white border-gray-100"} p-6 rounded-3xl shadow-sm border text-[14px]`}
        >
          <View className="flex-row justify-between">
            <View className="flex-row gap-2 items-center mb-5">
              <Text
                className={`${isDarkMode ? "text-white" : "text-gm-navy"} font-oswald-semibold uppercase tracking-widest`}
              >
                Duty Status:
              </Text>
              <Text
                className={`font-oswald-semibold uppercase tracking-widest ${isCheckedIn ? "text-green-400" : "text-red-400"}`}
              >
                {isCheckedIn ? "On Duty" : "Off Duty"}
              </Text>
            </View>
            {selfie && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setSelfie(null);
                  setCaptureField(null);
                }}
                className="p-1"
              >
                <X color="red" size={20} />
              </TouchableOpacity>
            )}
          </View>

          {/* Photo Verification Capture Button */}
          <TouchableOpacity
            onPress={() => triggerCameraFor(isCheckedIn ? "check" : "check")}
            disabled={uploadingImage || loading || updatingLoc}
            activeOpacity={0.7}
            className="mb-4 flex-row items-center justify-between p-3 rounded-xl border border-dashed border-indigo-400 bg-indigo-50/10 active:bg-indigo-50/20"
          >
            {uploadingImage && captureField === "check" ? (
              <View className="flex-row items-center justify-center w-full py-1">
                <ActivityIndicator
                  color={theme.accent || "#4f46e5"}
                  size="small"
                />
                <Text className="text-xs ml-2 text-indigo-400 font-medium">
                  Uploading verification photo...
                </Text>
              </View>
            ) : selfie && captureField === "check" ? (
              <>
                <View className="flex-row items-center flex-1">
                  <Image
                    source={{ uri: selfie }}
                    className="w-10 h-10 rounded-lg mr-3 border border-indigo-500"
                    resizeMode="cover"
                  />
                  <View>
                    <Text className="text-xs font-bold text-emerald-500">
                      Photo Ready for Shift Update
                    </Text>
                    <Text className="text-[10px] text-gray-400">
                      Tap box to retake
                    </Text>
                  </View>
                </View>
                <RefreshCw size={16} color="#818cf8" />
              </>
            ) : (
              <View className="flex-row items-center justify-center w-full py-1">
                <CameraIcon size={20} color={theme.accent || "#4f46e5"} />
                <Text
                  className={`text-xs ml-2 font-roboto-regular ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Tap to Scan Selfie for{" "}
                  {isCheckedIn ? "End Shift" : "Start Shift"}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Shift Toggle Action Button */}
          <TouchableOpacity
            onPress={handleCheckAction}
            disabled={
              loading ||
              uploadingImage ||
              updatingLoc ||
              !selfie ||
              captureField !== "check"
            }
            className={`w-full h-12 rounded-2xl flex-row items-center justify-center ${
              !selfie || captureField !== "check"
                ? "bg-gray-400/40"
                : isCheckedIn
                  ? "bg-red-500 active:bg-red-600"
                  : "bg-gm-navy active:bg-indigo-950"
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
                <Text
                  className={`font-oswald-semibold text-lg ml-2 ${
                    !selfie || captureField !== "check"
                      ? "text-gray-300"
                      : isCheckedIn
                        ? "text-white"
                        : "text-gm-gold"
                  }`}
                >
                  {isCheckedIn ? "End Shift" : "Verify & Start Shift"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Send Location (Only when On Duty) */}
          {isCheckedIn && (
            <View className="mt-6 pt-4 border-t border-gray-200/20">
              <TouchableOpacity
                onPress={() => triggerCameraFor("location")}
                disabled={uploadingImage || updatingLoc || loading}
                activeOpacity={0.7}
                className="mb-3 flex-row items-center justify-between p-3 rounded-xl border border-dashed border-sky-400 bg-sky-50/10"
              >
                {uploadingImage && captureField === "location" ? (
                  <View className="flex-row items-center justify-center w-full py-1">
                    <ActivityIndicator color="#0284c7" size="small" />
                    <Text className="text-xs ml-2 text-sky-400">
                      Uploading location photo...
                    </Text>
                  </View>
                ) : selfie && captureField === "location" ? (
                  <>
                    <View className="flex-row items-center flex-1">
                      <Image
                        source={{ uri: selfie }}
                        className="w-10 h-10 rounded-lg mr-3 border border-sky-500"
                        resizeMode="cover"
                      />
                      <View>
                        <Text className="text-xs font-bold text-sky-400">
                          Photo Ready for Location Sync
                        </Text>
                        <Text className="text-[10px] text-gray-400">
                          Tap box to retake
                        </Text>
                      </View>
                    </View>
                    <RefreshCw size={16} color="#38bdf8" />
                  </>
                ) : (
                  <View className="flex-row items-center justify-center w-full py-1">
                    <CameraIcon size={20} color="#0284c7" />
                    <Text
                      className={`text-xs ml-2 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                    >
                      Scan Selfie to Update Location
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSendLocation}
                disabled={
                  updatingLoc ||
                  loading ||
                  uploadingImage ||
                  !selfie ||
                  captureField !== "location"
                }
                className={`w-full h-12 rounded-2xl border ${
                  !selfie || captureField !== "location"
                    ? "bg-gray-400/20 border-transparent"
                    : isDarkMode
                      ? "bg-gm-navy border-gm-navy active:bg-slate-800"
                      : "bg-white border-gray-200 active:bg-gray-100"
                } flex-row items-center justify-center`}
              >
                {updatingLoc ? (
                  <ActivityIndicator color={"#4f46e5"} />
                ) : (
                  <>
                    <MapPin
                      color={
                        !selfie || captureField !== "location"
                          ? "#9ca3af"
                          : theme.accent
                      }
                      size={20}
                    />
                    <Text
                      className={`${
                        !selfie || captureField !== "location"
                          ? "text-gray-400"
                          : isDarkMode
                            ? "text-gm-gold"
                            : "text-gm-navy"
                      } font-oswald-semibold ml-2 text-base`}
                    >
                      Send Live Location
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* SECTION 3: DAILY EVENTS */}
      <View className="mb-4">
        <Text
          className={`text-lg font-oswald-semibold ${isDarkMode ? "text-gray-300" : "text-gm-navy"}`}
        >
          Today&apos;s Booking(s)
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/bookings" as any)}
          className={`${isDarkMode ? "bg-gm-navy border-gm-navy" : "bg-white border-gray-100"} p-6 rounded-[30px] shadow-xl flex-row items-center justify-between`}
        >
          <View className="flex-row items-center">
            <View
              className={`${isDarkMode ? "bg-gm-gold" : "bg-gm-navy"} w-12 h-12 rounded-2xl items-center justify-center mr-4`}
            >
              <Bell size={24} color="white" />
            </View>
            <View>
              <Text
                className={`text-lg ${isDarkMode ? "text-white" : "text-gm-navy"} font-oswald-semibold`}
              >
                {stats.active_bookings.toString()} Active Booking(s)
              </Text>
              <Text className="text-gray-400 font-roboto-regular text-xs">
                View facility Bookings For Today
              </Text>
            </View>
          </View>
          <ShieldCheck color={theme.accent} size={28} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
