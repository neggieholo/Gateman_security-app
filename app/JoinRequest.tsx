import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { fetchAllEstates, submitSecurityJoinRequest } from "./services/api";
import { Estate } from "./services/interfaces";
import { UserContext } from "./UserContext";

type IDType = "voters" | "nin" | "drivers";

export default function JoinRequestForm() {
  const navigation = useNavigation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState<boolean>(false);

  // KYC States (Storing Local URIs)
  const [selfie, setSelfie] = useState<string | null>(null);
  const [idType, setIdType] = useState<IDType>("nin");
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);

  // Estate States
  const [estateId, setEstateId] = useState("");
  const [estateLabel, setEstateLabel] = useState("");
  const [estates, setEstates] = useState<Estate[]>([]);
  const [selectorOpen, setSelectorOpen] = useState<boolean>(false);

  const { user, triggerRefresh } = useContext(UserContext);

  const RadioButton = ({ label, value }: { label: string; value: IDType }) => (
    <TouchableOpacity
      onPress={() => setIdType(value)}
      className="flex-row items-center mb-2"
    >
      <View
        className={`w-5 h-5 rounded-full border-2 border-indigo-600 mr-2 items-center justify-center`}
      >
        {idType === value && (
          <View className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
        )}
      </View>
      <Text>{label}</Text>
    </TouchableOpacity>
  );

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchAllEstates();
        setEstates(data);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Failed to load estates");
      }
    })();
  }, []);

  // 2. Camera/Gallery Handlers
  const handleCapture = async (
    type: "selfie" | "idFront" | "idBack" | "utility",
  ) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      return Alert.alert(
        "Permission Required",
        "Allow camera access to take KYC photos.",
      );
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: type === "selfie" ? [3, 4] : undefined,
      quality: 0.5,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      if (type === "selfie") setSelfie(uri);
      if (type === "idFront") setIdFront(uri);
      if (type === "idBack") setIdBack(uri);
    }
  };

  const handleSubmit = async () => {
    // Enhanced Validation
    if (!estateId) {
      return Alert.alert("Validation", "Please select an estate.");
    }
    if (!selfie || !idFront) {
      return Alert.alert(
        "Validation",
        "Please ensure your selfie and ID front are captured.",
      );
    }
    if (idType !== "nin" && !idBack) {
      return Alert.alert("Validation", "Please capture the back of your ID.");
    }

    setLoading(true);

    try {
      const formData = new FormData();
      // Use the fallback 'user?.id' directly to ensure it's fresh
      formData.append("tempSecurityId", user?.id || "");
      formData.append("estateId", estateId);
      formData.append("idType", idType);

      if (selfie)
        formData.append("selfie", {
          uri: selfie,
          name: "selfie.jpg",
          type: "image/jpeg",
        } as any);
      if (idFront)
        formData.append("idFront", {
          uri: idFront,
          name: "idFront.jpg",
          type: "image/jpeg",
        } as any);
      if (idBack)
        formData.append("idBack", {
          uri: idBack,
          name: "idBack.jpg",
          type: "image/jpeg",
        } as any);

      const response = await submitSecurityJoinRequest(formData);

      if (response.success) {
        Alert.alert(
          "Application Submitted",
          "Your application has been submitted for review.",
          [
            {
              text: "OK",
              onPress: () => {
                navigation.goBack();
                triggerRefresh();
              },
            },
          ],
        );
      } else {
        Alert.alert("Submission Failed", response.message || "Unknown error");
      }
    } catch (err: any) {
      console.error("Submit Error:", err);
      Alert.alert("Error", err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const isStep2Valid = idType === "nin" ? !!idFront : !!idFront && !!idBack;

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <Text className="text-xl font-bold mb-4 text-indigo-900">
        KYC Verification: Step {step} of 3
      </Text>

      {/* STEP 1: SELFIE (Camera Only) */}
      {step === 1 && (
        <View className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <Text className="text-lg font-semibold mb-2">Live Selfie</Text>
          <Text className="text-gray-500 mb-6">
            Take a clear photo of yourself to verify identity.
          </Text>

          <TouchableOpacity
            onPress={() => handleCapture("selfie")}
            className="border-dashed border-2 border-indigo-200 h-48 rounded-2xl items-center justify-center bg-indigo-50"
          >
            {selfie ? (
              <Image
                source={{ uri: selfie }}
                className="w-full h-full rounded-2xl"
              />
            ) : (
              <Text className="text-indigo-600 font-medium">Open Camera</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!selfie}
            onPress={nextStep}
            className={`p-4 mt-8 rounded-xl items-center ${selfie ? "bg-indigo-600" : "bg-gray-300"}`}
          >
            <Text className="text-white font-bold">Continue</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* STEP 2: ID DOCUMENT (Camera) */}
      {step === 2 && (
        <View className="bg-white p-6 rounded-2xl shadow-sm">
          <Text className="text-lg font-semibold mb-4">Identity Document</Text>
          <RadioButton label="NIN (Front Only)" value="nin" />
          <RadioButton label="Voter's ID (Front & Back)" value="voters" />
          <RadioButton label="Driver's License" value="drivers" />

          <View className="mt-4 space-y-4">
            <TouchableOpacity
              onPress={() => handleCapture("idFront")}
              className="border-dashed border-2 border-indigo-200 h-16 rounded-xl items-center justify-center p-2 bg-indigo-50"
            >
              <Text>{idFront ? "✅ Front Captured" : "📸 Capture Front"}</Text>
            </TouchableOpacity>

            {idType !== "nin" && (
              <TouchableOpacity
                onPress={() => handleCapture("idBack")}
                className="border-dashed border-2 border-indigo-200 h-16 rounded-xl items-center justify-center mt-3 p-2 bg-indigo-50"
              >
                <Text>{!idBack ? "📸 Capture Back" : "✅ Back Captured"}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="flex-row justify-between mt-8">
            <TouchableOpacity onPress={prevStep}>
              <Text className="p-4 text-gray-500">Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={nextStep}
              disabled={!isStep2Valid}
              className={`p-4 px-10 rounded-xl ${isStep2Valid ? "bg-indigo-600" : "bg-gray-300"}`}
            >
              <Text className="text-white font-bold">Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* STEP 3: ESTATE SELECTION (Existing Logic) */}
      {step === 3 && (
        <View>
          <Text className="text-lg mb-4">Final Details</Text>
          <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 16 }}>
            Join an Estate
          </Text>

          {/* Estate selector */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ marginBottom: 4 }}>Select Estate</Text>

            <TouchableOpacity
              onPress={() => setSelectorOpen(true)}
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 6,
                padding: 12,
                backgroundColor: "white",
              }}
            >
              <Text style={{ color: estateLabel ? "#000" : "#999" }}>
                {estateLabel || "Select an estate"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Modal selector */}
          <Modal visible={selectorOpen} transparent animationType="fade">
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.4)",
                justifyContent: "center",
                padding: 20,
              }}
              activeOpacity={1}
              onPress={() => setSelectorOpen(false)}
            >
              <View
                style={{
                  backgroundColor: "white",
                  borderRadius: 8,
                  maxHeight: "70%",
                }}
              >
                <FlatList
                  data={estates}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        setEstateId(item.id);
                        setEstateLabel(`${item.name} (${item.estate_code})`);
                        setSelectorOpen(false);
                      }}
                      style={{
                        padding: 16,
                        borderBottomWidth: 1,
                        borderBottomColor: "#eee",
                      }}
                    >
                      <Text>
                        {item.name} ({item.estate_code})
                      </Text>
                      <Text>
                        {item.city}, {item.town}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableOpacity>
          </Modal>

          <View className="flex-row justify-between mt-6">
            <TouchableOpacity onPress={prevStep}>
              <Text className="p-4">Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={{
                backgroundColor: "#4f46e5",
                paddingVertical: 14,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Text
                className="p-2"
                style={{ color: "white", fontWeight: "bold", fontSize: 16 }}
              >
                {loading ? "Submitting..." : "Submit Application"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
