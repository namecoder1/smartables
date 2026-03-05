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
  children_count?: string | null;
  allergies?: string | null;
  booking_time: string;
  status: "pending" | "confirmed" | "cancelled" | "no_show" | "arrived";
  source: "whatsapp_auto" | "manual" | "web" | "phone";
  notes: string;
  created_at: string;
};

export type CallbackRequest = {
  id: string;
  location_id: string;
  phone_number: string;
  status: "pending";
  notes: string;
  created_at: string;
  completed_at: string;
};

export type ContactAttribute = {
  id: string;
  location_id: string;
  phone_number: string;
  tag: string;
  metadata: any;
  created_at: string;
  updated_at: string;
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

export type Feedback = {
  id: string;
  organization_id: string;
  profile_id: string;
  type: string;
  reason: string;
  message: string;
  metadata: any;
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
  seats: number;
  telnyx_phone_number?: string | null;
  telnyx_connection_id?: string | null;
  telnyx_voice_app_id?: string | null;
  regulatory_requirement_id: string | null;
  activation_status: string;
  created_at: string;
  branding: LocationBranding | null;
  active_menu_id: string | null;
  meta_phone_id: string;
  display_name_status: string;
  voice_forwarding_number: string;
  max_covers_per_shift: number | null;
  standard_reservation_duration: number | null;
  cover_price: number | null;
  meta_verification_otp: string;
  is_branding_completed: boolean;
  is_test_completed: boolean;
};

export type MenuLocation = {
  menu_id: string;
  location_id: string;
  is_active: boolean;
};

export type MenuItem = {
  id: string;
  name: string;
  tags?: string[];
  price: number;
  is_new?: boolean;
  allergens?: string[];
  image_url?: string | null;
  sort_order: number;
  description: string | null;
  is_available: boolean;
};

export type MenuCategory = {
  id: string;
  name: string;
  items: MenuItem[];
  is_visible: boolean;
  sort_order: number;
  description: string | null;
};

export type Menu = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  pdf_url?: string | null;
  content: MenuCategory[];
  is_active: boolean;
  created_at: string;
  starts_at?: string | null;
  ends_at?: string | null;
};

export type MessageLog = {
  id: string;
  organization_id: string;
  location_id: string;
  customer_id: string;
  cost_implication: boolean;
  sent_at: string;
  payload: any;
  phone_number: string;
  template_name: string;
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
  email: string;
  accessible_locations: string[] | null;
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
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "more_info_required"
    | "unapproved";
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

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "served"
  | "completed"
  | "cancelled";
export type OrderItemStatus = "pending" | "preparing" | "served" | "cancelled";

export type Order = {
  id: string;
  organization_id: string;
  location_id: string;
  table_id?: string | null;
  booking_id?: string | null;
  status: OrderStatus;
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[]; // Virtual relation
};

export type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  notes: string | null;
  status: OrderItemStatus;
};

// -- Promotion Types --

export type PromotionType =
  | "percentage"
  | "fixed_amount"
  | "bundle"
  | "cover_override";
export type PromotionItemTargetType =
  | "menu_item"
  | "category"
  | "full_menu"
  | "cover";
export type PromotionItemRole = "target" | "condition";

export type PromotionItem = {
  id: string;
  promotion_id: string;
  target_type: PromotionItemTargetType;
  target_ref: string | null;
  role: PromotionItemRole;
  override_value: number | null;
  override_type: string | null;
};

export type PromotionLocation = {
  promotion_id: string;
  location_id: string;
};

export type PromotionMenu = {
  promotion_id: string;
  menu_id: string;
};

export type Promotion = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  type: PromotionType;
  value: number | null;
  all_locations: boolean;
  all_menus: boolean;
  starts_at: string | null;
  ends_at: string | null;
  recurring_schedule: any | null;
  visit_threshold: number | null;
  is_active: boolean;
  priority: number;
  stackable: boolean;
  notify_via_whatsapp: boolean;
  created_at: string;
  updated_at: string;
  // Joined relations
  promotion_locations?: PromotionLocation[];
  promotion_menus?: PromotionMenu[];
  promotion_items?: PromotionItem[];
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

// -- Server Action State Types --

export type CreateBookingState = {
  message?: string;
  error?: string | null;
  success?: boolean;
  bookingId?: string;
};
