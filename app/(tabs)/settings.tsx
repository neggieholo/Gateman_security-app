import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  Building,
  ChevronRight,
  Landmark,
  Lock,
  Phone,
  User,
} from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import PhoneInput from "react-native-phone-number-input";
import { useUser } from "../UserContext";
import { sendProfileOtpApi } from "../services/api";

export default function ResidentSettings() {
  const { user, isDarkMode, theme } = useUser();
  const BASE_URL = `${process.env.EXPO_PUBLIC_BASE_URL}/api`;
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const phoneInputRef = useRef<PhoneInput>(null);

  const [error, setError] = useState<string>("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [metadata, setMetadata] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [verifyingField, setVerifyingField] = useState<
    "email" | "phone" | null
  >(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyingOtp, setverifyingOtp] = useState(false);

  const inputRefs = useRef(
    Array(6)
      .fill(0)
      .map(() => React.createRef<TextInput>()),
  ).current;

  const [profile, setProfile] = useState({
    name: user?.name || "",
    estate: user?.estate_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    email_verified: !!user?.email,
    phone_verified: !!user?.phone,
    biometric_login: user?.biometric_login || false,
  });

  const profileFields = [
    {
      label: "Full Name",
      value: profile.name,
      icon: <User size={16} color="#94a3b8" />,
    },
  ];

  if (profile.estate) {
    profileFields.push({
      label: "Estate",
      value: profile.estate,
      icon: <Landmark size={16} color="#94a3b8" />,
    });
  }

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "",
        estate: user?.estate_name || "",
        email: user.email || "",
        phone: user.phone || "",
        email_verified: !!user.email,
        phone_verified: !!user.phone,
        biometric_login: user?.biometric_login || false,
      });
    }
  }, [user]);

  const handleFieldChange = (field: "email", value: string) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
      [`${field}_verified`]: value.trim() === (user?.email || ""),
    }));
  };

  const handlePhoneChange = (value: string) => {
    console.log("Phone change:", value);
    const phoneValue = value || "";
    setProfile((prev) => ({
      ...prev,
      phone: phoneValue,
      phone_verified: phoneValue.trim() === (user?.phone || ""),
    }));
  };

  const validateEmail = (text: string) => {
    const cleanedEmail = text.trim();
    const reg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (reg.test(cleanedEmail)) {
      return true;
    }
    return false;
  };

  const handleRequestOtp = async (target: string, type: "email" | "phone") => {
    let actualTarget = target;

    if (type === "email") {
      if (!validateEmail(actualTarget.trim())) {
        Alert.alert("Invalid Email", "Check your email format.");
        return;
      }
    }

    if (type === "phone") {
      actualTarget =
        phoneInputRef.current?.getNumberAfterPossiblyEliminatingZero()
          ?.formattedNumber || "";

      if (!actualTarget) {
        actualTarget = profile.phone;
      }
    }
    setVerifyingField(type);

    setOtpLoading(true);
    setError("");

    try {
      const otpRes = await sendProfileOtpApi(
        (target = actualTarget.trim()),
        type,
      );
      if (otpRes.success) {
        console.log("Otp success Response:", otpRes);
        setMetadata(otpRes.metadata);
        setShowOtpInput(true);
      } else {
        Alert.alert("Request Failed", otpRes.message || "Failed to send OTP");
        setError(otpRes.message || "Failed to send OTP");
      }
    } catch (err) {
      Alert.alert("Error", "Could not connect to the server.");
      setError("Network error");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const cleanValue = value.replace(/[^0-9]/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = cleanValue;
    setOtp(newOtp);

    if (cleanValue && index < 5) {
      inputRefs[index + 1].current?.focus();
    }

    if (newOtp.join("").length === 6) {
      handleOtpVerify(newOtp.join(""));
    }
  };

  const handleOtpVerify = async (finalOtp: string) => {
    setverifyingOtp(true);
    try {
      const targetValue =
        verifyingField === "phone"
          ? phoneInputRef.current?.getNumberAfterPossiblyEliminatingZero()
              ?.formattedNumber || profile.phone
          : profile.email;
      const res = await fetch(`${BASE_URL}/admin/verify-otp-only`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otp: finalOtp,
          metadata: metadata,
          target: targetValue,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setProfile((prev) => ({
          ...prev,
          [`${verifyingField}_verified`]: true,
        }));
        setShowOtpInput(false);
        setOtp(["", "", "", "", "", ""]);
        setVerifyingField(null);
      } else {
        setError(data.message || "Invalid Code");
      }
    } catch (err) {
      setError("Verification failed");
    } finally {
      setverifyingOtp(false);
    }
  };

  const handleCancelOtp = () => {
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setShowOtpInput(false);
  };

  const toggleBiometrics = async (newValue: boolean) => {
    if (newValue === true) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        return Alert.alert(
          "Not Supported",
          "Please enable biometrics in your phone settings first.",
        );
      }

      // Scan to verify the user is the owner of the device
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Confirm identity to enable Biometric Login",
      });

      if (result.success) {
        await AsyncStorage.setItem("biometrics_active", "true");
        setProfile((prev) => ({
          ...prev,
          biometric_login: true,
        }));
      } else {
        Alert.alert(
          "Unrecognized",
          "Biometric authentication failed. Please try again.",
        );
        setProfile((prev) => ({
          ...prev,
          biometric_login: false,
        }));
        await AsyncStorage.setItem("biometrics_active", "false");
      }
    } else {
      setProfile((prev) => ({
        ...prev,
        biometric_login: false,
      }));
      await AsyncStorage.setItem("biometrics_active", "false");
    }
  };

  const handleSaveConfig = async () => {
    if (
      (profile.email !== user?.email && !profile.email_verified) ||
      (profile.phone !== user?.phone && !profile.phone_verified)
    ) {
      Alert.alert(
        "Verification Required",
        "Verify your new contact details first.",
      );
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/security/update-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: profile.email,
          phone: profile.phone,
          biometric_login: profile.biometric_login,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (profile.email !== user?.email) {
          await SecureStore.setItemAsync("user_email", profile.email);
        }
        Alert.alert("Success", "Profile updated successfully");
        setIsEditing(false);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    profile.email.trim() !== (user?.email || "") ||
    profile.phone.trim() !== (user?.phone || "") ||
    profile.biometric_login !== (user?.biometric_login || false);

  const memoizedHeader = useMemo(
    () => (
      <View
        className={`${isDarkMode ? "bg-gm-navy/20" : "bg-gray-50 "}  p-6 pb-20`}
      >
        <Text
          className={`${isDarkMode ? "text-gm-charcoal" : "text-slate-500"} text-lg font-oswald-semibold mb-8`}
        >
          Manage your contact and security info
        </Text>

        {/* 1. Locked Identity Section */}
        <View
          className={`${isDarkMode ? "bg-gm-navy" : "bg-white"} p-6 rounded-3xl border border-slate-100 shadow-sm mb-6`}
        >
          <View className="flex-row items-center mb-4">
            <Building size={20} color="#4f46e5" />
            <Text
              className={`ml-2 font-montserrat-bold ${isDarkMode ? "text-white" : "text-gm-navy"} text-lg`}
            >
              Residence Info
            </Text>
          </View>

          {profileFields.map((item, index) => (
            <View key={index} className="mb-4">
              <Text
                className={`text-[10px] font-oswald-semibold ${isDarkMode ? "text-gm-gold" : "text-slate-400 "} uppercase tracking-widest mb-1`}
              >
                {item!.label}
              </Text>
              <View
                className={`flex-row items-center ${isDarkMode ? "bg-gm-navy border-gm-gold" : "bg-slate-50 border-slate-100"} p-4 rounded-2xl border`}
              >
                {item!.icon}
                <Text className="ml-3 font-roboto-regular font-bold text-slate-500">
                  {item!.value}
                </Text>
                <View className="ml-auto">
                  <Lock size={14} color="#cbd5e1" />
                </View>
              </View>
            </View>
          ))}
        </View>

        <View
          className={`${isDarkMode ? "bg-gm-navy" : "bg-white"} p-6 rounded-3xl border border-slate-100 shadow-sm mb-6`}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Phone size={20} color="#10b981" />
              <Text
                className={`ml-2 ${isDarkMode ? "text-white" : "text-gm-navy"} font-montserrat-bold text-lg`}
              >
                Contact Details
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                if (isEditing) {
                  setProfile({
                    name: user?.name || "",
                    estate: user?.estate_name || "",
                    email: user?.email || "",
                    phone: user?.phone || "",
                    email_verified: !!user?.email,
                    phone_verified: !!user?.phone,
                    biometric_login: user?.biometric_login || false,
                  });
                  setError("");
                }
                setIsEditing(!isEditing);
              }}
            >
              <Text className="text-red-400 font-roboto-regular font-bold">
                {isEditing ? "Cancel" : "Edit"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Email */}
          <View className="mb-4 relative flex">
            <View className="flex-row justify-between mb-1">
              <Text
                className={`text-[10px] font-oswald-semibold ${isDarkMode ? "text-gm-gold" : "text-slate-400"} uppercase tracking-widest`}
              >
                Email Address
              </Text>
              {profile.email_verified && (
                <Text className="text-[9px] font-bold text-emerald-500 uppercase">
                  Verified
                </Text>
              )}
            </View>
            <TextInput
              editable={isEditing}
              value={profile.email}
              onChangeText={(text) => handleFieldChange("email", text)}
              className={`p-4 rounded-2xl font-roboto-regular border ${
                isEditing
                  ? isDarkMode
                    ? "bg-gm-navy border-white text-white"
                    : "bg-white border-indigo-500 text-gm-navy"
                  : isDarkMode
                    ? "bg-gm-navy border-gm-gold text-slate-300"
                    : "bg-slate-50 border-transparent text-slate-500"
              }`}
            />
            {!profile.email_verified && isEditing && !showOtpInput && (
              <TouchableOpacity
                className="w-full flex-row justify-end mb-2 h-12"
                onPress={() => handleRequestOtp(profile.email, "email")}
              >
                {otpLoading && verifyingField === "email" ? (
                  <ActivityIndicator size="small" color="#4f46e5" />
                ) : (
                  <Text className="bg-indigo-600 font-bold text-sm m-2 rounded-sm p-1 text-white">
                    Verify
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Phone */}
          <View className="mb-2 relative flex">
            <View className="flex-row justify-between mb-1">
              <Text
                className={`text-[10px] font-oswald-semibold ${isDarkMode ? "text-gm-gold" : "text-slate-400"} uppercase tracking-widest`}
              >
                Phone Number
              </Text>
              {profile.phone_verified && (
                <Text className="text-[9px] font-bold text-emerald-500 uppercase mr-1">
                  Verified
                </Text>
              )}
            </View>
            <PhoneInput
              key={isEditing ? "editing" : "viewing"}
              ref={phoneInputRef}
              defaultValue={profile.phone?.replace("+234", "")}
              defaultCode="NG"
              disabled={!isEditing}
              onChangeFormattedText={handlePhoneChange}
              countryPickerButtonStyle={{
                backgroundColor: "transparent",
                width: 40,
              }}
              codeTextStyle={{
                color: isDarkMode ? "#FFFFFF" : "#0F172A",
                fontFamily: "Roboto-Regular",
                fontSize: 14,
                marginLeft: -10,
              }}
              containerStyle={{
                width: "100%",
                height: 50,
                borderRadius: 16,
                borderWidth: isEditing ? 2 : 1,
                backgroundColor: isEditing
                  ? isDarkMode
                    ? "#001F3F"
                    : "#FFFFFF"
                  : isDarkMode
                    ? "#001F3F"
                    : "#F8FAFC",
                borderColor: isEditing
                  ? isDarkMode
                    ? "#FFFFFF"
                    : "#4F46E5"
                  : isDarkMode
                    ? "#D4AF37"
                    : "transparent",
                paddingTop: Platform.OS === "android" ? 2 : 0,
              }}
              textInputProps={{
                placeholderTextColor: "#94a3b8",
                maxLength: 10,
              }}
              textContainerStyle={{
                backgroundColor: "transparent",
                paddingVertical: 0,
              }}
              textInputStyle={{
                color: isEditing
                  ? isDarkMode
                    ? "#FFFFFF"
                    : "#0F172A"
                  : isDarkMode
                    ? "#cbd5e1"
                    : "#64748B",
                fontFamily: "Roboto-Regular",
                fontSize: 14,
              }}
            />
            {!profile.phone_verified && isEditing && !showOtpInput && (
              <TouchableOpacity
                className="w-full flex-row justify-end h-12"
                onPress={() => handleRequestOtp(profile.phone, "phone")}
              >
                {otpLoading && verifyingField === "phone" ? (
                  <ActivityIndicator size="small" color="#4f46e5" />
                ) : (
                  <Text className="bg-indigo-600 font-bold text-sm m-2 rounded-sm p-1 text-white">
                    Verify
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {user?.estate_id && (
            <View
              className={`${isDarkMode ? "bg-gm-navy border-gm-gold" : "bg-white border-slate-100"} p-6 rounded-3xl border shadow-sm mt-6`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View
                    className={`${isDarkMode ? "bg-gm-gold" : "bg-indigo-50"} p-2 rounded-xl`}
                  >
                    <User size={20} color="#4f46e5" />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text
                      className={`${isDarkMode ? "text-gm-gold" : "text-gm-navy"}  font-montserrat-bold text-md`}
                    >
                      Biometric Login
                    </Text>
                    <Text
                      className={`${isDarkMode ? "text-white" : "text-slate-500"}  text-xs font-roboto-regular`}
                    >
                      Use fingerprint or face ID to secure your account
                    </Text>
                  </View>
                </View>

                <Switch
                  value={profile.biometric_login}
                  disabled={!isEditing}
                  onValueChange={(value) => toggleBiometrics(value)}
                  trackColor={{
                    false: "#cbd5e1",
                    true: isDarkMode ? "#D4AF37" : "#4f46e5",
                  }}
                  thumbColor={
                    Platform.OS === "ios"
                      ? "#fff"
                      : profile.biometric_login
                        ? "#fff"
                        : "#f4f3f4"
                  }
                />
              </View>
            </View>
          )}
        </View>
        <TouchableOpacity
          className={`${isDarkMode ? "bg-gm-navy" : "bg-white"} p-5 rounded-3xl flex-row items-center justify-between shadow-lg`}
          onPress={() => router.push("/ChangePassword" as any)}
        >
          <View className="flex-row items-center">
            <View className="bg-white/10 p-2 rounded-xl">
              <Lock size={20} color={theme.accent} />
            </View>
            <Text
              className={`ml-4  font-montserrat-bold ${isDarkMode ? "text-gm-gold" : "text-gm-navy"}`}
            >
              Change Password
            </Text>
          </View>
          <ChevronRight size={20} color={theme.accent} />
        </TouchableOpacity>

        {isEditing && (
          <TouchableOpacity
            className={`mt-8 p-5 rounded-3xl items-center shadow-xl ${
              hasChanges
                ? isDarkMode
                  ? "bg-gm-charcoal shadow-black" 
                  : "bg-gm-navy shadow-indigo-200" 
                : isDarkMode
                  ? "bg-slate-800 shadow-none" 
                  : "bg-slate-200 shadow-none" 
            }`}
            onPress={handleSaveConfig}
            disabled={!hasChanges || saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-black text-lg text-center">
                Save Changes
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    ),
    [
      profile,
      isEditing,
      otpLoading,
      verifyingField,
      showOtpInput,
      saving,
      hasChanges,
      isDarkMode
    ],
  );

  return (
    <View className="flex-1 bg-slate-50">
      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={memoizedHeader}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
      />

      <Modal visible={showOtpInput} animationType="fade" transparent={true}>
        <View className="flex-1 justify-center items-center bg-black/60 px-6">
          <View className="bg-white w-full rounded-[2.5rem] p-8 items-center shadow-2xl">
            <Text className="text-2xl font-black text-slate-900 mb-2">
              Confirm Code
            </Text>
            <Text className="text-slate-500 text-center mb-8">
              Enter the code sent to your {verifyingField}
            </Text>
            <View className="flex-row justify-between w-full mb-8">
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={inputRefs[index]}
                  className="w-12 h-14 border-2 border-slate-100 bg-slate-50 rounded-xl text-center text-xl font-bold focus:border-indigo-500"
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(v) => handleOtpChange(v, index)}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === "Backspace") {
                      if (!otp[index] && index > 0) {
                        // 1. Move focus back
                        inputRefs[index - 1].current?.focus();

                        // 2. Clear the previous box's content
                        const newOtp = [...otp];
                        newOtp[index - 1] = "";
                        setOtp(newOtp);
                      }
                    }
                  }}
                />
              ))}
            </View>
            {verifyingOtp ? (
              <Text className="text-blue-500 font-bold mb-4">Verifying...</Text>
            ) : (
              <TouchableOpacity onPress={handleCancelOtp} disabled={otpLoading}>
                <Text className="text-red-500 font-bold">Cancel</Text>
              </TouchableOpacity>
            )}
            {error ? (
              <Text className="text-rose-500 mt-4 font-bold">{error}</Text>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}
