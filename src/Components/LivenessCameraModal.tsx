import { useAppState } from "@react-native-community/hooks";
import { useIsFocused } from "expo-router";
import { CameraIcon, Eye, RefreshCw, Smile, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  CameraPosition,
  CameraRef,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import {
  Camera,
  Face,
  FaceDetectorOptions,
  useImageFaceDetector,
} from "react-native-vision-camera-face-detector";

interface Props {
  visible: boolean;
  onClose: () => void;
  onLivenessSuccess: (photoUri: string) => void;
}

export default function LivenessCameraModal({
  visible,
  onClose,
  onLivenessSuccess,
}: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const containerHeight = 320; // 80 Tailwind units (h-80 = 20rem = 320px)

  const { hasPermission, requestPermission } = useCameraPermission();

  const [cameraFacing, setCameraFacing] =
    useState<Extract<CameraPosition, "front" | "back">>("front");
  const [isLivenessActive, setIsLivenessActive] = useState<boolean>(false);
  const [livenessStatus, setLivenessStatus] = useState<string>("Ready");
  const [capturedUri, setCapturedUri] = useState<string | null>(null);

  const cameraRef = useRef<CameraRef>(null);
  const isCapturingRef = useRef<boolean>(false);
  const sawEyesOpenRef = useRef<boolean>(false);
  const missedFramesRef = useRef<number>(0);

  const faceDetectorOptions = useRef<FaceDetectorOptions>({
    performanceMode: "fast",
    runClassifications: true,
    runContours: false,
    runLandmarks: false,
    windowWidth: windowWidth,
    windowHeight: containerHeight,
  }).current;

  // JSI Native Frame Processor Binding
  const imageFaceDetector = useImageFaceDetector(faceDetectorOptions);

  const isFocused = useIsFocused();
  const appState = useAppState();
  const isCameraActive = visible && isFocused && appState === "active";
  const cameraDevice = useCameraDevice(cameraFacing);

  // Animated Bounding Box Values
  const aFaceW = useSharedValue(0);
  const aFaceH = useSharedValue(0);
  const aFaceX = useSharedValue(0);
  const aFaceY = useSharedValue(0);

  const boundingBoxStyle = useAnimatedStyle(() => ({
    position: "absolute",
    zIndex: 50,
    borderWidth: 2,
    borderColor: "rgb(99, 102, 241)", // Indigo color
    borderRadius: 12,
    width: withTiming(aFaceW.value, { duration: 80 }),
    height: withTiming(aFaceH.value, { duration: 80 }),
    left: withTiming(aFaceX.value, { duration: 80 }),
    top: withTiming(aFaceY.value, { duration: 80 }),
  }));

  useEffect(() => {
    if (visible && !hasPermission) {
      requestPermission();
    }
  }, [visible, hasPermission]);

  const resetState = () => {
    setIsLivenessActive(false);
    setLivenessStatus("Ready");
    setCapturedUri(null);
    isCapturingRef.current = false;
    sawEyesOpenRef.current = false;
    missedFramesRef.current = 0;
    aFaceW.value = 0;
    aFaceH.value = 0;
    aFaceX.value = 0;
    aFaceY.value = 0;
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  function handleCameraMountError(error: any) {
    console.error("camera mount error", error);
  }

  const captureAndDetect = async () => {
    if (!cameraRef.current) return;
    try {
      const snapshot = await cameraRef.current.takeSnapshot();
      const path = await snapshot.saveToTemporaryFileAsync("jpg");

      const formattedPath = path.startsWith("file://")
        ? path
        : `file://${path}`;
      setCapturedUri(formattedPath);
      setLivenessStatus("Verification Passed!");

      setTimeout(() => {
        onLivenessSuccess(formattedPath);
        handleClose();
      }, 800);
    } catch (err) {
      console.error("Failed to capture snapshot:", err);
      setLivenessStatus("Capture failed!");
      isCapturingRef.current = false;
    }
  };

  const handleFacesDetected = async (detectedFaces: Face[]) => {
    try {
      if (!isCameraActive || isCapturingRef.current) return;

      if (!detectedFaces || detectedFaces.length === 0) {
        missedFramesRef.current += 1;
        // Only collapse the box if we miss face detection for 5 consecutive frames (~150ms buffer)
        if (missedFramesRef.current > 5) {
          aFaceW.value = 0;
          aFaceH.value = 0;
          aFaceX.value = 0;
          aFaceY.value = 0;
          if (isLivenessActive) {
            setLivenessStatus("No face detected! Look at camera.");
          }
        }
        return;
      }

      // Reset missed frame counter when face is detected
      missedFramesRef.current = 0;

      const face = detectedFaces[0];
      const { bounds } = face;

      // Handle front camera horizontal mirroring adjustment if needed
      let calculatedX = bounds.x;
      if (cameraFacing === "front") {
        calculatedX = windowWidth - bounds.x - bounds.width;
      }

      aFaceW.value = bounds.width;
      aFaceH.value = bounds.height;
      aFaceX.value = Math.max(0, calculatedX);
      aFaceY.value = Math.max(0, bounds.y);

      if (isLivenessActive) {
        const leftEyeProb = face.leftEyeOpenProbability ?? 1;
        const rightEyeProb = face.rightEyeOpenProbability ?? 1;
        const smilingProb = face.smilingProbability ?? 0;

        const isFacingForward =
          Math.abs(face.yawAngle) < 12 && Math.abs(face.pitchAngle) < 12;

        if (!isFacingForward) {
          setLivenessStatus("Look directly at camera...");
          sawEyesOpenRef.current = false;
          return;
        }

        const eyesAreOpen = leftEyeProb > 0.7 && rightEyeProb > 0.7;
        const eyesAreClosed = leftEyeProb < 0.25 && rightEyeProb < 0.25;
        const isSmiling = smilingProb > 0.75;

        if (eyesAreOpen) {
          sawEyesOpenRef.current = true;
        }

        const isConfirmedBlink = sawEyesOpenRef.current && eyesAreClosed;

        if (isConfirmedBlink || isSmiling) {
          isCapturingRef.current = true;
          setLivenessStatus("Liveness verified! Capturing...");
          await captureAndDetect();
        } else {
          setLivenessStatus("Blink or Smile to verify...");
        }
      }
    } catch (err) {
      console.warn("Face detection JSI error caught:", err);
    }
  };

  const startLivenessCheck = () => {
    setIsLivenessActive(true);
    setLivenessStatus("Blink or Smile to verify...");
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/80 justify-center items-center p-4">
        {/* Compact Modal Box */}
        <View className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          {/* Header */}
          <View className="p-4 flex-row justify-between items-center bg-slate-950/60 border-b border-slate-800">
            <Text className="text-white font-bold text-sm tracking-widest uppercase">
              GateMan Liveness Check
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              className="p-1 rounded-full bg-slate-800 active:bg-slate-700"
            >
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Camera Container */}
          <View className="w-full h-80 bg-black justify-center items-center relative overflow-hidden">
            {!hasPermission ? (
              <View className="items-center p-4">
                <CameraIcon size={36} color="#818cf8" />
                <Text className="text-white font-semibold text-center mt-2">
                  Camera Access Required
                </Text>
                <TouchableOpacity
                  onPress={requestPermission}
                  className="mt-3 bg-indigo-600 px-4 py-2 rounded-lg"
                >
                  <Text className="text-white text-xs font-bold">Grant</Text>
                </TouchableOpacity>
              </View>
            ) : !cameraDevice ? (
              <Text className="text-gray-400 text-xs">No device found</Text>
            ) : (
              <>
                <Camera
                  ref={cameraRef}
                  style={{ width: "100%", height: "100%" }}
                  isActive={isCameraActive}
                  device={cameraDevice}
                  onError={handleCameraMountError}
                  onFacesDetected={handleFacesDetected}
                  {...faceDetectorOptions}
                  cameraFacing={cameraFacing}
                />

                {/* Animated Bounding Box */}
                <Animated.View style={boundingBoxStyle} pointerEvents="none" />

                {/* Captured Preview Overlay */}
                {capturedUri && (
                  <View className="absolute top-3 right-3 border-2 border-emerald-400 rounded-lg overflow-hidden bg-black z-50">
                    <Image
                      source={{ uri: capturedUri }}
                      className="w-16 h-20"
                      resizeMode="cover"
                    />
                  </View>
                )}
              </>
            )}

            {/* Status Banner */}
            <View className="absolute bottom-3 left-4 right-4 bg-slate-950/90 border border-slate-700/60 py-2 px-3 rounded-xl flex-row items-center justify-center z-50">
              {isCapturingRef.current ? (
                <ActivityIndicator size="small" color="#818cf8" />
              ) : isLivenessActive ? (
                <Smile size={18} color="#818cf8" />
              ) : (
                <Eye size={18} color="#94a3b8" />
              )}
              <Text className="text-white text-xs font-medium ml-2 text-center">
                {livenessStatus}
              </Text>
            </View>
          </View>

          {/* Control Footer */}
          <View className="p-4 bg-slate-950/80 flex-row gap-2">
            <TouchableOpacity
              onPress={() =>
                setCameraFacing((curr) => (curr === "front" ? "back" : "front"))
              }
              className="p-3 bg-slate-800 rounded-xl justify-center items-center active:bg-slate-700"
            >
              <RefreshCw size={18} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              disabled={!hasPermission || !cameraDevice || isLivenessActive}
              onPress={startLivenessCheck}
              className={`flex-1 py-3 rounded-xl justify-center items-center ${
                isLivenessActive
                  ? "bg-indigo-900/50"
                  : "bg-indigo-600 active:bg-indigo-700"
              }`}
            >
              <Text className="text-white font-bold text-sm">
                {isLivenessActive ? "Verifying..." : "Start Liveness Check"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
