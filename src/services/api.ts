import Constants from "expo-constants";
import * as Device from "expo-device";
import { File } from "expo-file-system";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import {
  Estate,
  FetchNotificationsResponse,
  Invitation,
  tempNotification,
} from "./interfaces";

const BASE_URL = `${process.env.EXPO_PUBLIC_BASE_URL}/api`;

export const registerSecurity = async (
  name: string,
  email: string,
  password: string,
  phone: string,
) => {
  try {
    const res = await fetch(`${BASE_URL}/auth/register/security`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, phone }),
      credentials: "include", // Ensures the session is set immediately
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, message: data.message || "Registration failed" };
    }

    return data;
  } catch (err) {
    console.error("Security Registration Error:", err);
    return { success: false, message: "Network error during registration" };
  }
};

export const postLogin = async (
  email: string,
  password: string,
  biometric_login: boolean,
  coordinates: { latitude: number; longitude: number } | null,
  deviceMeta: {
    phone: (string | undefined)[];
    platform: string | null;
    model: string | null;
    version: string | null;
    isTablet: boolean;
  },
) => {
  try {
    const res = await fetch(`${BASE_URL}/auth/login/security`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        biometric_login,
        coordinates,
        deviceMeta,
      }),
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: data.error || "Login failed", // This picks up your info.message
      };
    }
    return data; // Returns { success: true, isTemp, user, sessionId }
  } catch (err) {
    console.error("Security Login Error:", err);
    return { success: false, message: "Network error during login" };
  }
};

export default async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "GateMan Alerts",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      throw new Error(
        "Permission not granted to get push token for push notification!",
      );
    }
    // Inside your register function
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId ??
      "986508ab-d7ea-483c-b310-bd21cda01f48";

    if (!projectId) {
      throw new Error("Project ID not found");
    }
    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log(pushTokenString);
      return pushTokenString;
    } catch (e: unknown) {
      throw new Error(`${e}`);
    }
  } else {
    throw new Error("Must use physical device for push notifications");
  }
}

export const updatePushTokenApi = async (token: string) => {
  try {
    const response = await fetch(`${BASE_URL}/security/update-push-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pushToken: token }),
      credentials: "include",
    });
    return await response.json();
  } catch (error) {
    console.error("Push Token Sync Error:", error);
    return { success: false };
  }
};

export const sendOtpApi = async (target: string, type: string) => {
  try {
    const res = await fetch(`${BASE_URL}/auth/app/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, type, role: "SECURITY" }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, message: data.message || "Server error" };
    }

    return data;
  } catch (err) {
    console.error("OTP error:", err);
    return { success: false, message: "Network connection failed" };
  }
};

export const forgotPasswordApi = async (
  email: string,
  role: "admin" | "tenant" | "security",
) => {
  try {
    const res = await fetch(`${BASE_URL}/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim(),
        role,
      }),
    });

    const data = await res.json();
    return data;
  } catch (err) {
    console.log("Forgot Password Error:", err);
    return { success: false, message: "Network error" };
  }
};

export const fetchAllEstates = async (): Promise<Estate[]> => {
  const res = await fetch(`${BASE_URL}/admin/estates`, {
    method: "GET",
    credentials: "include",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch estates");
  }

  return data.estates;
};

export const submitSecurityJoinRequest = async (formData: FormData) => {
  console.log("Submitting Join Request with data:", formData);
  try {
    const res = await fetch(`${BASE_URL}/security/join-request`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, message: data.error || "Submission failed" };
    }
    return data;
  } catch (err) {
    console.error("KYC Submission Error:", err);
    return { success: false, message: "Failed to upload documents" };
  }
};

export const getMyApplicationStatus = async () => {
  try {
    const res = await fetch(`${BASE_URL}/security/my-request`, {
      method: "GET",
      credentials: "include",
    });

    const data = await res.json();

    if (data.success) {
      console.log("Notification Data:", data);
      let standardized: tempNotification | null = null;

      // 1. Handle Pending Request
      if (data.activeRequest) {
        standardized = {
          from: "Gateman",
          type: "pending",
          message: `Your join request to ${data.activeRequest.estate_name} is still pending`,
          reason: "Please wait for admin approval.",
        };
      }
      // 2. Handle Feedback (Decline/Block)
      else if (data.feedback) {
        try {
          // Parse the JSON string stored in the rejection_message column
          const parsedFeedback =
            typeof data.feedback === "string"
              ? JSON.parse(data.feedback)
              : data.feedback;

          const type = parsedFeedback.type;

          standardized = {
            from: parsedFeedback.estate || "Estate Admin",
            type: type,
            message:
              type === "decline"
                ? "Your request was declined"
                : type === "approve"
                  ? "You have been approved"
                  : "You have been restricted",
            reason: parsedFeedback.message || "No specific reason provided.",
          };
        } catch (e) {
          console.error("Failed to parse feedback JSON", e);
        }
      }

      console.log("Standardized:", standardized);
      return {
        success: true,
        notification: standardized,
        isRead: data.isRead,
      };
    }
    return { success: false };
  } catch (err) {
    console.error("Fetch Status Error:", err);
    return { success: false };
  }
};

export const markSecurityNotificationRead = async () => {
  try {
    const res = await fetch(`${BASE_URL}/security/notification/read`, {
      method: "PUT",
      credentials: "include",
    });
    return await res.json();
  } catch (err) {
    console.error("Mark Read Error:", err);
    return { success: false };
  }
};

export const dismissSecurityNotification = async () => {
  try {
    const res = await fetch(`${BASE_URL}/security/notification/dismiss`, {
      method: "DELETE",
      credentials: "include",
    });
    return await res.json();
  } catch (err) {
    console.error("Dismiss Notification Error:", err);
    return { success: false };
  }
};

export const getSecurityColleagues = async () => {
  try {
    const res = await fetch(`${BASE_URL}/security/all`, {
      method: "GET",
      credentials: "include",
    });
    return await res.json();
  } catch (err) {
    console.error("Fetch Colleagues Error:", err);
    return { success: false };
  }
};

export const updateDutyStatus = async (onDuty: boolean, location: string) => {
  const endpoint = onDuty
    ? "/security/duty/check-in"
    : "/security/duty/check-out";
  return await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ location }),
    credentials: "include",
  }).then((res) => res.json());
};

export const postLogout = async () => {
  const res = await fetch(`${BASE_URL}/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  const data = await res.json();

  return data;
};

export const toggleSecurityStatus = async (location: any, photo?: string) => {
  try {
    const res = await fetch(`${BASE_URL}/security/status-toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location, livenessPhotoUrl: photo }),
      credentials: "include",
    });

    const data = await res.json();
    return data; // Returns { success: true, isOnDuty }
  } catch (err) {
    console.error("Status Toggle Error:", err);
    return { success: false, message: "Network error" };
  }
};

export const fetchGatePasses = async (): Promise<Invitation[]> => {
  try {
    const res = await fetch(`${BASE_URL}/security/invitations`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to fetch passes");
    }

    const data = await res.json();
    // console.log("Fetched Invitations:", data);
    return data;
  } catch (error) {
    console.error("Fetch Error:", error);
    return [];
  }
};

export const logActivityApi = async (
  inviteId: string,
  action: "check_in" | "check_out",
): Promise<{ success: boolean; invitation?: Invitation; error?: string }> => {
  try {
    const res = await fetch(
      `${BASE_URL}/invitations/log-activity/${inviteId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
        credentials: "include",
      },
    );

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error || "Action failed" };
    }

    return { success: true, invitation: data.invitation };
  } catch (error) {
    console.error("❌ Log Activity Error:", error);
    return { success: false, error: "Network error" };
  }
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string,
  role: string,
) => {
  try {
    const response = await fetch(`${BASE_URL}/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword, role }),
    });
    return await response.json();
  } catch (err) {
    return { success: false, message: "Network error" };
  }
};

export const updateSecurityLocation = async (
  latitude: number,
  longitude: number,
  selfie: string,
) => {
  try {
    const res = await fetch(`${BASE_URL}/security/update-location`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude, longitude, selfie }),
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, message: data.error || "Location sync failed" };
    }

    return { success: true };
  } catch (err) {
    console.error("Location Sync Error:", err);
    return { success: false, message: "Network error during location sync" };
  }
};

export const getDashboardStats = async () => {
  try {
    const res = await fetch(`${BASE_URL}/security/dashboard-stats`, {
      method: "GET",
      credentials: "include",
    });

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Dashboard Stats Fetch Error:", err);
    // Return a fallback stats object so the UI doesn't break
    return {
      success: false,
      stats: {
        total_expected: 0,
        checked_in: 0,
        checked_out: 0,
        overstayed: 0,
        active_events: 0,
      },
    };
  }
};
export const fetchNotifications =
  async (): Promise<FetchNotificationsResponse> => {
    try {
      const res = await fetch(`${BASE_URL}/notifications`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      return data;
    } catch (err) {
      return { success: false, list: [], lastReadAt: "1970-01-01" };
    }
  };

export const markAllAsReadApi = async () => {
  try {
    const res = await fetch(`${BASE_URL}/notifications/read-all`, {
      method: "PUT",
      credentials: "include",
    });
    return await res.json();
  } catch (err) {
    return { success: false };
  }
};

export const deleteNotificationApi = async (id: string) => {
  try {
    const res = await fetch(`${BASE_URL}/notifications/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (err) {
    console.error("Delete API Error:", err);
    return { success: false };
  }
};

export const sendProfileOtpApi = async (target: string, type: string) => {
  try {
    const res = await fetch(`${BASE_URL}/admin/security/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, type }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, message: data.message || "Server error" };
    }

    return data;
  } catch (err) {
    console.error("OTP error:", err);
    return { success: false, message: "Network connection failed" };
  }
};

export const getTodayBookings = async () => {
  try {
    const res = await fetch(`${BASE_URL}/security/bookings`, {
      method: "GET",
      credentials: "include",
    });
    return await res.json();
  } catch (err) {
    console.error("Events fetch error:", err);
    return [];
  }
};

export const toggleGuestStatus = async (registrationId: string) => {
  try {
    const response = await fetch(
      `${BASE_URL}/event/registrations/${registrationId}/toggle-status`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update status");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch Error:", error);
    throw error;
  }
};

export const checkAllOut = async (eventId: string) => {
  try {
    const response = await fetch(`${BASE_URL}/event/${eventId}/check-all-out`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) throw new Error("Bulk checkout failed");
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const getInvitationById = async (code: string) => {
  try {
    const response = await fetch(`${BASE_URL}/invitations/${code}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const data = await response.json();
    // console.log('Fetched Invitation:',data)
    return data;
  } catch (error) {
    console.error("API Error (getInvitationById):", error);
    return { success: false, message: "Network request failed" };
  }
};

// Helper to format 24h to AM/PM
export const formatTime = (timeStr: string) => {
  if (!timeStr) return "N/A";
  const [hours, minutes] = timeStr.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const formattedHours = h % 12 || 12;
  return `${formattedHours}:${minutes} ${ampm}`;
};

export const formatDate = (dateStr: string) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${day}-${month}-${year}`;
};

interface UploadResul {
  fileUrl: string;
}

export async function getS3UploadedUrl(
  imageUri: string,
  folder: string = "selfies",
): Promise<string> {
  // 1. Get file details
  const fileExtension = imageUri.split(".").pop()?.toLowerCase() || "jpg";
  const mimeType = fileExtension === "png" ? "image/png" : "image/jpeg";
  const fileName = `upload_${Date.now()}.${fileExtension}`;

  // 2. FETCH #1: Get temporary signed upload URL from your Node backend
  const urlResponse = await fetch(`${BASE_URL}/get-upload-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName,
      fileType: mimeType,
      folder,
    }),
  });

  if (!urlResponse.ok) {
    throw new Error(
      `Failed to get presigned URL from backend: ${urlResponse.status}`,
    );
  }

  const { uploadUrl, fileUrl } = await urlResponse.json();

  // 3. Convert local mobile image URI (file://...) to binary blob
  const localImage = await fetch(imageUri);
  const blob = await localImage.blob();

  // 4. FETCH #2: Upload binary directly to AWS S3 using the signed link
  const s3Response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": mimeType,
    },
    body: blob,
  });

  if (!s3Response.ok) {
    throw new Error(
      `Direct S3 binary upload failed with status ${s3Response.status}`,
    );
  }

  // 5. Return the clean public HTTPS URL ready for PostgreSQL
  return fileUrl;
}

export const cleanupLocalFile = async (uri: string | null) => {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
      console.log("Cleaned up local file:", uri);
    }
  } catch (err) {
    console.warn("Failed to delete local cache file:", err);
  }
};