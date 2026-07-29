import { useEffect } from "react";
import RNCallKeep from "react-native-callkeep";
import LoginScreen from "../../src/Screens/LoginScreen";
import "../global.css";

const options = {
  ios: {
    appName: "GateMan Security",
  },
  android: {
    alertTitle: "Permissions required",
    alertDescription: "This application needs to access your phone accounts",
    cancelButton: "Cancel",
    okButton: "ok",
    imageName: "../../assets/images/splash-icon.png",
    additionalPermissions: [""],
    foregroundService: {
      channelId: "com.snametech.gateman",
      channelName: "GateMan Panic Help Service",
      notificationTitle: "GateMan is running",
      notificationIcon: "../../assets/images/splash-icon.png",
    },
  },
};

export const initializeCallKeep = async () => {
  try {
    await RNCallKeep.setup(options);
    RNCallKeep.setAvailable(true);
  } catch (err) {
    console.error("CallKeep Setup Error:", err);
  }
};

export default function Index() {
  useEffect(() => {
    initializeCallKeep();
  }, []);

  return <LoginScreen />;
}
