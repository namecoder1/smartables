// -- Main DB Types --

export type Booking = {
  id: string;
  organization_id: string;
  location_id: string;
  customer_id: string;
  table_id?: string | null;
  guest_name: string;
  guest_phone: string;
  guests_count: number;
  booking_time: string;
  status: "pending" | "confirmed" | "cancelled" | "no_show" | "arrived";
  source: "whatsapp_auto" | "manual" | "web" | "phone";
  notes: string;
  created_at: string;
};

export type Customer = {
  id: string;
  organization_id: string;
  location_id: string;
  phone_number: string;
  name: string;
  total_visits: number;
  last_visit: string;
  created_at: string;
};

export type Location = {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  address: string | null;
  phone_number: string | null;
  opening_hours: WeeklyHours;
  branding: LocationBranding | null;
  active_menu_id: string | null;
  seats: number;

  telnyx_phone_number?: string | null;
  telnyx_connection_id?: string | null;
  telnyx_voice_app_id?: string | null;
  regulatory_requirement_id: string | null;

  activation_status: string;
  created_at: string;
};

export type MenuLocation = {
  menu_id: string;
  location_id: string;
  is_active: boolean;
};

export type Menu = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  pdf_url?: string | null;
  content: any[];
  is_active: boolean;
  created_at: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  billing_email: string;
  activation_status: string;
  created_by: string;

  stripe_customer_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string;
  stripe_status: string;
  stripe_current_period_end: string;
  stripe_cancel_at_period_end: boolean;

  whatsapp_usage_count: number;
  telnyx_managed_account_id: string;
  created_at: string;

  billing_tier: string;
  plan_msg_limit: number;

  current_billing_cycle_start: string;
  usage_cap_whatsapp: number;
};

export type Profile = {
  id: string;
  organization_id: string;
  full_name: string;
  role: string;
  created_at: string;
};

export type RestaurantTable = {
  id: string;
  zone_id: string;
  table_number: string;
  seats: number;
  shape: string;
  position_x: number;
  position_y: number;
  rotation: number;
  width: number;
  height: number;
  is_active: boolean;
  created_at: string;
};

export type RestaurantZone = {
  id: string;
  location_id: string;
  name: string;
  width: number;
  height: number;
  created_at: string;
};

export type SubscriptionPlan = {
  id: string;
  stripe_price_id: string;
  name: string;
  key: string;
  limits: any;
  created_at: string;
};

export type TelnyxRegulatoryRequirement = {
  id: string;
  organization_id: string;
  area_code: string;
  country_code: string;
  telnyx_requirement_group_id: string;
  telnyx_bundle_request_id: string;
  status: "pending" | "approved" | "rejected" | "more_info_required";
  rejection_reason: string;
  documents_data: any;
  created_at: string;
  updated_at: string;
};

export type Transaction = {
  id: string;
  organization_id: string;
  amount: number;
  type: "subscription" | "usage" | "topup" | "bonus" | "refund" | "adjustment";
  description: string;
  reference_id?: string;
  metadata: any;
  stripe_invoice_id?: string;
  stripe_payment_intent_id?: string;
  currency: string;
  status: string;
  invoice_pdf?: string;
  period_start?: string;
  period_end?: string;
  created_at: string;
};

export type Feedback = {
  id: string;
  organization_id: string;
  profile_id: string;
  type: string;
  reason: string | null;
  message: string | null;
  metadata: any;
  created_at: string;
};

// -- Utility Types --

export interface LocationBranding {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  logo_url: string;
  social_links: {
    instagram: string;
    facebook: string;
    tiktok: string;
  };
}

export type TimeSlot = {
  id: string;
  open: string;
  close: string;
};

export type WeeklyHours = {
  [key: string]: TimeSlot[];
};

export type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Booking;
};
