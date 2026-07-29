export interface Estate {
  id: string;
  name: string;
  estate_code: string;
  created_at: string | null;
  city: string | null;
  town: string | null;
}

export interface SecurityUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  estate_id: string;
  estate_name?: string;
  push_token?: string;
  is_on_duty: boolean;
  showWelcome?: boolean;
  last_checkin?: string;
  last_checkout?: string;
  checkin_location?: string;
  checkout_location?: string;
  last_known_location?: string;
  last_location_time?: string;
  checkin_mode: "SHARED_KIOSK" | "DISTRIBUTED_CODE";
  isTemp?: boolean;
  biometric_login: boolean;
  password_changed: boolean;
  role: "SECURITY";
  id_type?: string;
  id_front_url?: string;
  id_back_url?: string;
  last_notification_read_at: string;
}

export interface tempNotification {
  from: string;
  type: string;
  message: string;
  reason: string;
}

export interface notification {
  id: string;
  estate_id: number;
  user_id: number | null;
  recipient_role: "tenant" | "security" | "admin";
  title: string;
  message: string;
  type: "general" | "emergency" | "entry" | "invite" | "announcement";
  created_at: string;
  is_deleted: boolean;
}

export interface FetchNotificationsResponse {
  success: boolean;
  list: notification[];
  lastReadAt: string;
}

export type IDType =
  | "National ID"
  | "Drivers License"
  | "Voters Card"
  | "International Passport";

export interface TempSecurityUser {
  id: string;
  name: string;
  email: string;
  rejection_message?: string | null; // Stores the JSON string from the backend
  is_read: boolean;
  role: "TEMP_SECURITY";
}

export interface SecurityColleague {
  id: string;
  name: string;
  avatar?: string | null;
  is_on_duty: boolean;
  checkin_location?: string | null;
  last_active?: string; // Optional: for "Last seen" logic
}

export interface SecurityDutyLog {
  id: string;
  security_id: string;
  guard_name: string;
  checkin_time: string;
  checkout_time?: string | null;
  checkin_location?: string;
  checkout_location?: string | null;
}

export interface SecurityJoinRequestStatus {
  id: string;
  temp_security_id: string;
  estate_id: string;
  estate_name: string; // From the JOIN in /my-request
  id_type: IDType;
  status: "PENDING" | "APPROVED" | "DECLINED";
  requested_at: string;
  selfie_url: string;
  id_front_url: string;
  id_back_url: string;
}

export interface RejectionFeedback {
  type: "decline" | "block";
  estate: string;
  message: string;
}

export interface LocationPair {
  block: string;
  unit: string[]; // Dynamic string array for multi-unit selection
}

export interface Invitation {
  id: string;
  guest_name: string;
  guest_phone: string;
  guest_image_url?: string;
  access_code: string;
  status: "pending" | "checked_in" | "checked_out" | "overstayed";
  invite_type: "one_time" | "multi_entry" | "staff_entry";
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  actual_checkin_date?: string;
  actual_checkout_date?: string;
  is_cancelled: boolean;
  excluded_dates?: string[];
  // Joined Fields
  resident_name?: string;
  locations: {
    [estateId: string]: LocationPair[];
  };
  estate_name?: string;
  estate_address?: string;
  lga?: string;
  town?: string;
  staff_position?: string;
  permitted_days: number[];
  is_activated?: boolean;
}

// -------------------- API Response Interfaces --------------------

export interface ApplicationStatusResponse {
  success: boolean;
  activeRequest: SecurityJoinRequestStatus | null;
  feedback: string | null; // This is the stringified RejectionFeedback
  isRead: boolean;
}

export interface JoinRequestSubmitResponse {
  success: boolean;
  joinRequest?: SecurityJoinRequestStatus;
  error?: string;
}

export interface EventGuest {
  id: string;
  guest_name: string;
  guest_code: string;
  status: "registered" | "checked_in" | "checked_out";
  checked_in_at: string | null;
  checked_out_at: string | null;
  is_checked_in: boolean;
  is_checked_out: boolean;
}

export interface LocationBooking {
  id: string; // uuid
  estate_id: string; // uuid
  resident_id: string; // uuid
  resident_name: string | null;
  resident_avatar: string | null;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  start_time: string; // HH:mm:ss
  end_time: string; // HH:mm:ss
  venue_id: number;
  created_at: string | null;
  booked_dates: string[];
  venue_name: string | null;
  is_paid: boolean;
  payment_url: string | null;
  transaction_ref: string | null;
  payment_type: string | null;
  total_amount: number | string;
}
