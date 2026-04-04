// app/context/UserContext.tsx
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import React, {
  createContext,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import { io, Socket } from "socket.io-client";
import { getMyApplicationStatus } from "./services/api";
import { SecurityUser, tempNotification } from "./services/interfaces";

interface UserContextType {
  user: Partial<SecurityUser> | null;
  setUser: (user: Partial<SecurityUser> | null) => void;
  sessionId?: string;
  setSessionId?: (sessionId: string) => void;
  tempnotification: tempNotification | null;
  setTempnotification: (notification: tempNotification | null) => void;
  triggerRefresh: () => void;
  badgeCount: number;
  setBadgeCount: (count: number) => void;
  pushToken?: string | null;
  setPushToken: (token: string | null) => void;
  socket: Socket | null;
  isConnected: boolean; 
}

export const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  sessionId: "",
  setSessionId: () => {},
  tempnotification: null,
  setTempnotification: () => {},
  triggerRefresh: () => {},
  badgeCount: 0,
  setBadgeCount: () => {},
  pushToken: null,
  setPushToken: () => {},
  socket: null,
  isConnected: false,
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Partial<SecurityUser> | null>(null);
  const [tempnotification, setTempnotification] =
    useState<tempNotification | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<boolean>(false);
  const [badgeCount, setBadgeCount] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const triggerRefresh = () => setRefreshTrigger((prev) => !prev);
  const BASE_URL = `${process.env.EXPO_PUBLIC_BASE_URL}`;

  useEffect(() => {
    if (!sessionId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const newSocket = io(BASE_URL, {
      path: "/api/socket.io",
      transports: ["websocket"],
      autoConnect: true,
      extraHeaders: {
        cookie: `gateman.sid=${sessionId}`,
      },
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      console.log("✅ Socket Connected via Session ID");
    });

    // 3. Existing status_update listener
    newSocket.on("status_update", (data) => {
      setTempnotification(data);
      setBadgeCount(1);
    });

    socketRef.current = newSocket;

    return () => {
      newSocket.off("status_update");
      newSocket.close();
      socketRef.current = null;
    };
  }, [sessionId, BASE_URL]);

  useEffect(() => {
    const getStatus = async () => {
      if (user?.isTemp) {
        const result = await getMyApplicationStatus();

        if (result && result.notification) {
          setTempnotification(result.notification);

          // 🚀 Only increase badge if notification exists AND isRead is false
          if (result.isRead === false) {
            setBadgeCount(1);
          } else {
            setBadgeCount(0);
          }
        } else {
          setTempnotification(null);
          setBadgeCount(0);
        }
      } else {
        setTempnotification(null);
        setBadgeCount(0);
      }
    };

    getStatus();
  }, [user, refreshTrigger]);

  useEffect(() => {
    const setupNotifications = async () => {
      // 1. Create the Channel (Mandatory for Android Dev Builds)
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "GateMan Alerts",
          importance: Notifications.AndroidImportance.MAX,
          showBadge: true,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }

      // 2. Set the handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    };

    setupNotifications(); //
  }, [user]);

  useEffect(() => {
    // 1. Handle notification that arrives while app is OPEN (Foreground)
    const foregroundSubscription =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Foreground Notification:", notification);
        // You could trigger a small in-app toast here if you wanted
      });

    // 2. Handle tapping the notification (Background/Quit/Foreground)
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as any;

        console.log("Notification Tapped with data:", data);

        if (data.type === "notification") {
          router.push({
            pathname: user?.id && isConnected ? "./NotificationsPage" : "/",
          });
        }
      });

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }, [isConnected, user]);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        tempnotification,
        setTempnotification,
        triggerRefresh,
        badgeCount,
        setBadgeCount,
        sessionId,
        setSessionId,
        pushToken,
        setPushToken,
        socket: socketRef.current,
        isConnected,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = React.useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
