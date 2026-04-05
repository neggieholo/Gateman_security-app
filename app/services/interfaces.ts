
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
  role: 'SECURITY';
  id_type?: string;       
  id_front_url?: string;
  id_back_url?: string;
}

export interface tempNotification {
  from: string;
  message: string;
  reason: string;
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
  guest_image_url: string | null;
  access_code: string;
  invite_type: 'one_time' | 'multi_entry';
  start_date: any;
  end_date: any;
  start_time: any;
  end_time: any;
  excluded_dates: string[]; 
  status: string;
  actual_checkin: any;
  actual_checkout: any;
  actual_checkin_date: any;
  actual_checkout_date: any;
  created_at: string;
  is_cancelled: boolean;
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