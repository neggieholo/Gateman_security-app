
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
  isTemp?: boolean;
  biometric_login: boolean;
  password_changed: boolean;
  role: 'SECURITY';
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
  recipient_role: 'tenant' | 'security' | 'admin';
  title: string;
  message: string;
  type: 'general' | 'emergency' | 'entry' | 'invite' | 'announcement';
  created_at: string; 
  is_deleted: boolean;
}

export interface FetchNotificationsResponse {
  success: boolean;
  list: notification[];
  lastReadAt: string;   
}

export type IDType = 'National ID' | 'Drivers License' | 'Voters Card' | 'International Passport';

export interface TempSecurityUser {
  id: string;
  name: string;
  email: string;
  rejection_message?: string | null; // Stores the JSON string from the backend
  is_read: boolean;
  role: 'TEMP_SECURITY';
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
  status: 'PENDING' | 'APPROVED' | 'DECLINED';
  requested_at: string;
  selfie_url: string;
  id_front_url: string;
  id_back_url: string;
}

export interface RejectionFeedback {
  type: 'decline' | 'block';
  estate: string;
  message: string;
}

export interface Invitation {
  id: string;
  guest_name: string;
  guest_image_url?: string;
  access_code: string;
  status: 'pending' | 'checked_in' | 'checked_out' | 'overstayed';
  invite_type: 'single_entry' | 'multi_entry';
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
  block?: string;
  unit?: string;
  estate_name?: string;
  lga?: string;
  town?: string;
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
  status: 'registered' | 'checked_in' | 'checked_out';
  checked_in_at: string | null;
  checked_out_at: string | null;
  is_checked_in:  boolean;
  is_checked_out:  boolean;

}

export interface EstateEvent {
  id: string;
  estate_id: string;
  organizer_id: string;
  title: string;
  description: string | null;
  banner_url: string | null;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  venue_detail: string | null;
  expected_guests: number;
  is_paid: boolean;
  ticket_price: number;
  is_approved: boolean;
  // Aggregated fields from your SQL query
  registered_count: number; 
  currently_inside: number; // Counted from guests where in != null && out == null
  total_checked_out: number; // Counted from guests where out != null
  guest_list: EventGuest[];
}