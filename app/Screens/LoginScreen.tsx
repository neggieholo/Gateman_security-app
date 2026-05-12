import AsyncStorage from "@react-native-async-storage/async-storage";
import CookieManager from "@react-native-cookies/cookies";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Fingerprint, ScanFace } from "lucide-react-native";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import PhoneInput from "react-native-phone-number-input";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../Components/Button";
import { FormInput } from "../Components/FormInput";
import registerForPushNotificationsAsync, {
  forgotPasswordApi,
  postLogin,
  registerSecurity,
  sendOtpApi,
  updatePushTokenApi,
} from "../services/api";
import { UserContext } from "../UserContext";

export default function LoginScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [formattedPhone, setFormattedPhone] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [isForgot, setIsForgot] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const { setUser, setSessionId, setPushToken } = useContext(UserContext);
  const BASE_URL = `${process.env.EXPO_PUBLIC_BASE_URL}`;
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [metadata, setMetadata] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const phoneInputRef = useRef<PhoneInput>(null);
  const [showBiometricBtn, setShowBiometricBtn] = useState(false);
  const inputRefs = Array(6)
    .fill(0)
    .map(() => React.createRef<TextInput>());

  useEffect(() => {
    const checkPref = async () => {
      const active = await AsyncStorage.getItem("biometrics_active");
      if (active === "true") {
        setShowBiometricBtn(true);
      }
    };
    checkPref();
  }, []);

  const handleLogin = async (
    userEmail = email,
    userPassword = password,
    biometric_login = false,
  ) => {
    setLoading(true);
    setError("");
    console.log("Login details:", email, password);
    try {
      await CookieManager.clearAll();
      console.log("🧹 Cookie Jar Wiped!");
      const response = await postLogin(
        userEmail,
        userPassword,
        biometric_login,
      );
      if (!response.success && response.message === "PASSWORD_CHANGED") {
        await AsyncStorage.setItem("biometrics_active", "false");
        setShowBiometricBtn(false);
        Alert.alert(
          "Re-authentication Required",
          "Your password was changed. Please log in manually. You can then continue using Biometric Login as usual.",
          [{ text: "OK" }],
        );
      }
      if (response.success) {
        const cookies = await CookieManager.get(BASE_URL);
        // console.log("🍪 Captured Cookies:", cookies);

        if (cookies["gateman.sid"]) {
          console.log("✅ gateman.sid found in Cookie Jar!");
        } else {
          console.warn(
            "⚠️ Login success but gateman.sid missing from manager.",
          );
        }
        if (!biometric_login) {
          Promise.all([
            SecureStore.setItemAsync("user_email", email),
            SecureStore.setItemAsync("user_password", password),
          ]).catch((err) => console.error("Vault sync failed", err));
        }

        if (response.user.biometric_login) {
          await AsyncStorage.setItem("biometrics_active", "true");
          setShowBiometricBtn(true);
        }

        setUser(response.user);
        // console.log("User:", response.user)
        try {
          const pushTokenResponse = await registerForPushNotificationsAsync();
          if (pushTokenResponse) {
            console.log("📱 Push token obtained:", pushTokenResponse);
            setPushToken(pushTokenResponse);
            await updatePushTokenApi(pushTokenResponse);
          }
        } catch (pushErr) {
          console.warn("Push token failed, continuing login:", pushErr);
        }
        console.log("Login successful, session ID:", response.sessionId);
        setSessionId?.(response.sessionId);
        router.replace("/dashboard" as any);
      } else {
        setError(
          response.message === "PASSWORD_CHANGED"
            ? "Please Log in Manually "
            : response.message || "Login failed",
        );
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    const savedEmail = await SecureStore.getItemAsync("user_email");
    const savedPass = await SecureStore.getItemAsync("user_password");

    if (!savedEmail || !savedPass) {
      return Alert.alert(
        "Manual Login Required",
        "Please log in manually once.",
      );
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Login to GateMan Security",
    });

    if (result.success) {
      handleLogin(savedEmail, savedPass, true);
    } else {
      Alert.alert("Not Recognised");
    }
  };

  const validateEmail = (text: string) => {
    const cleanedEmail = text.trim();
    const reg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (reg.test(cleanedEmail)) {
      return true;
    }
    return false;
  };

  const handleRequestOtp = async () => {
    const trimmedEmail = email.trim();

    // 1. Basic Email Validation
    if (!validateEmail(trimmedEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    const checkValid = phoneInputRef.current?.isValidNumber(phone);

    if (!phone || !checkValid) {
      Alert.alert(
        "Invalid Phone Number",
        "The phone number provided is incorrect for the selected country.",
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const otpRes = await sendOtpApi(trimmedEmail);
      if (otpRes.success) {
        setMetadata(otpRes.metadata);
        setShowOtpInput(true);
      } else {
        setError(otpRes.message || "Failed to send OTP");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    // Clean the input to only allow numbers
    const cleanValue = value.replace(/[^0-9]/g, "");

    const newOtp = [...otp];
    newOtp[index] = cleanValue;

    // 1. Update STATE so the user SEES the number in the box
    setOtp(newOtp);

    // 2. Move Focus
    if (cleanValue && index < 5) {
      inputRefs[index + 1].current?.focus();
    }

    // 3. Logic: Use the local variable to avoid the 'async state' delay
    const finalOtpString = newOtp.join("");

    if (finalOtpString.length === 6) {
      handleRegister(finalOtpString);
    }
  };

  // Inside your component
  const handleCancelOtp = () => {
    setOtp(["", "", "", "", "", ""]); // Reset the 6 boxes
    setError(""); // Clear any previous "Invalid Code" errors
    setShowOtpInput(false); // Close the modal
  };

  const handleRegister = async (newOtp: string) => {
    const trimmedEmail = email.trim();

    if (newOtp.length !== 6) {
      Alert.alert(
        "Invalid Code",
        "Please enter the 6-digit code sent to your email.",
      );
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await registerSecurity(
        name,
        trimmedEmail,
        password,
        formattedPhone,
        newOtp,
        metadata,
      );
      if (response.success) {
        setUser(response.user);
        router.replace("/dashboard" as any);
      } else {
        setError(response.message || "Registration failed");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!validateEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address first.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await forgotPasswordApi(email, "security");
      if (response.success) {
        Alert.alert(
          "Success",
          "Check your email for the reset link.",
          [{ text: "OK", onPress: () => setIsForgot(false) }], // Send them back to login
        );
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      bottomOffset={60}
      className="flex-1"
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <SafeAreaView className="flex-1 bg-gm-navy">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className={`flex-1 px-6 flex ${!showBiometricBtn ? "" : "gap-5"}`}
        >
          <View className="w-full flex justify-center items-center mt-8">
            <Image
              source={require("../../assets/images/gateman_login_image_nobg.png")}
              style={{
                width: "80%",
                height: 160,
              }}
              resizeMode="contain"
            />

            {/* THE SLOGAN AS LIVE TEXT */}
            <View className="mt-2 mb-6 items-center">
              <Text className="text-gm-gold font-montserrat text-sm uppercase tracking-[4px]">
                Your Security... Our Mission
              </Text>
              {/* Decorative line to give it that "Elite" feel */}
              <View className="h-[1px] w-12 bg-gm-gold/40 mt-2" />
            </View>
          </View>

          {isLogin && !isForgot && (
            <View
              className={`justify-center ${!showBiometricBtn ? "flex-1" : ""}`}
            >
              <View className="bg-gm-gold rounded-md p-6">
                <Text className="text-3xl font-bold mb-6 text-center text-black">
                  Login
                </Text>

                <FormInput
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />
                <FormInput
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />

                <TouchableOpacity
                  onPress={() => {
                    setIsForgot(true);
                    setError(""); // Clear any login errors
                  }}
                >
                  <Text className="text-md font-bold text-gm-navy m-3">
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                {error ? (
                  <Text className="text-red-500 mb-2">{error}</Text>
                ) : null}

                <Button
                  title={loading ? "Logging in..." : "Login"}
                  onPress={() => handleLogin()}
                  disabled={loading}
                />

                <View className="flex-row justify-center mt-4">
                  <Text>Don&apos;t have an account? </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setIsLogin(false);
                      setError("");
                      setName("");
                      setEmail("");
                      setPassword("");
                    }}
                  >
                    <Text className="text-red-800 font-bold">Sign Up</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {!isLogin && !isForgot && (
            <View
              className={`justify-center ${!showBiometricBtn ? "flex-1" : ""}`}
            >
              <View className="bg-gm-gold  rounded-md p-6">
                <Text className="text-3xl font-bold mb-6 text-center text-black">
                  Register
                </Text>

                <FormInput
                  placeholder="Full Name"
                  value={name}
                  onChangeText={setName}
                />
                <FormInput
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                />
                <View className="mb-4">
                  <PhoneInput
                    ref={phoneInputRef}
                    defaultValue={phone}
                    defaultCode="NG"
                    layout="first"
                    onChangeText={setPhone}
                    onChangeFormattedText={setFormattedPhone}
                    placeholder="Phone Number"
                    containerStyle={{
                      width: "100%",
                      height: 40,
                      borderRadius: 5,
                      backgroundColor: "rgba(0,0,0,0.7)",
                      borderWidth: 1,
                      borderColor: "#4B5563",
                      overflow: "hidden",
                    }}
                    textContainerStyle={{
                      backgroundColor: "transparent",
                      paddingVertical: 0,
                    }}
                    textInputStyle={{
                      color: "#FFFFFF",
                      fontSize: 16,
                      height: 55,
                    }}
                    codeTextStyle={{
                      color: "#FFFFFF",
                      fontSize: 16,
                    }}
                    textInputProps={{
                      placeholderTextColor: "rgba(255,255,255,0.6)",
                    }}
                    withDarkTheme
                  />
                </View>
                <FormInput
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />

                {error ? (
                  <Text className="text-red-500 mb-2">{error}</Text>
                ) : null}

                <Button
                  title={loading ? "Registering..." : "Register"}
                  onPress={handleRequestOtp}
                  disabled={loading}
                />

                <View className="flex-row justify-center mt-4">
                  <Text>Already have an account? </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setIsLogin(true);
                      setError("");
                      setName("");
                      setEmail("");
                      setPassword("");
                    }}
                  >
                    <Text className="text-red-800 font-bold">Login</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {isForgot && (
            <View
              className={`justify-center ${!showBiometricBtn ? "flex-1" : ""}`}
            >
              <View className="bg-gm-gold rounded-md p-6">
                <Text className="text-3xl font-bold mb-6 text-center text-black">
                  Forgot Password
                </Text>

                <FormInput
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />
                {error ? (
                  <Text className="text-red-500 mb-2">{error}</Text>
                ) : null}

                <Button
                  title={loading ? "Sending..." : "Send Reset Link"}
                  onPress={handleForgotPassword}
                  disabled={loading}
                />

                <View className="flex-row justify-center mt-4">
                  <TouchableOpacity
                    onPress={() => {
                      setIsLogin(true);
                      setIsForgot(false);
                      setError("");
                      setName("");
                      setEmail("");
                      setPassword("");
                    }}
                  >
                    <Text className="text-red-800 font-bold">
                      Back to Login
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {showBiometricBtn && isLogin && !isForgot && (
            <View className="items-center mt-8">
              <TouchableOpacity
                onPress={handleBiometricLogin}
                className="bg-gm-navy/70 p-4 rounded-full border border-white/40"
              >
                {Platform.OS === "ios" ? (
                  <ScanFace size={32} color="white" />
                ) : (
                  <Fingerprint size={32} color="white" />
                )}
              </TouchableOpacity>
            </View>
          )}

          <Modal
            visible={showOtpInput}
            animationType="slide"
            transparent={true}
          >
            <View className="flex-1 justify-center items-center bg-black/50 px-6">
              <View className="bg-white w-full rounded-2xl p-8 items-center">
                <Text className="text-2xl font-bold text-gray-800 mb-2">
                  Verify Email
                </Text>
                <Text className="text-gray-500 text-center mb-8">
                  Enter the code sent to {"\n"}
                  <Text className="font-bold">{email}</Text>
                </Text>

                {/* 6 Individual Boxes */}
                <View className="flex-row justify-between w-full mb-8">
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={inputRefs[index]}
                      className="w-10 h-12 border-2 border-gray-300 rounded-lg text-center text-xl font-bold focus:border-blue-500"
                      keyboardType="number-pad"
                      maxLength={1}
                      value={digit}
                      onChangeText={(value) => handleOtpChange(value, index)}
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

                {loading ? (
                  <Text className="text-blue-500 font-bold mb-4">
                    Verifying...
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleCancelOtp}>
                    <Text className="text-red-500 font-bold">Cancel</Text>
                  </TouchableOpacity>
                )}

                {error ? (
                  <Text className="text-red-500 mt-4">{error}</Text>
                ) : null}
              </View>
            </View>
          </Modal>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </KeyboardAwareScrollView>
  );
}
