// -- WABA Template Types --

export type WabaTemplateStatus =
  | 'DRAFT'       // created locally, not yet submitted to Meta
  | 'PENDING'     // submitted to Meta, awaiting review
  | 'APPROVED'    // approved by Meta, ready to use
  | 'REJECTED'    // rejected by Meta (see rejection_reason)
  | 'PAUSED'      // temporarily paused by Meta due to quality issues
  | 'DISABLED';   // permanently disabled by Meta

/** Purpose/context of the template — drives structure, required buttons, Meta category. */
export type WabaTemplateType =
  | 'recovery_open'     // replaces missed_call_open per-location when APPROVED
  | 'recovery_closed'   // replaces missed_call_closed per-location when APPROVED
  | 'booking_reminder'  // future: per-location override of verify_booking (Trigger.dev task)
  | 'service_update'    // UTILITY, free structure (LLM gate active)
  | 'promotion'         // MARKETING (€0.0572/conv IT), no LLM gate
  | 'news'              // MARKETING (€0.0572/conv IT), no LLM gate
  | 'custom';           // UTILITY, free structure (LLM gate active)

export type WabaTemplateCategory = 'UTILITY' | 'MARKETING';

/**
 * Semantic role — stored locally in JSONB, never sent to Meta.
 * Used by call.ts to inject canonical payloads at send time, preserving
 * handleButtonClick logic regardless of the button display text.
 */
export type ButtonSemanticRole =
  | 'supplier_flag'      // QUICK_REPLY → injects payload "fornitore"
  | 'callback_request'   // QUICK_REPLY → injects payload "richiama"
  | 'booking_flow'       // FLOW button → opens prenotazione_tavolo_v1
  | 'menu_link'          // QUICK_REPLY → injects payload "menu"
  | 'booking_confirm'    // QUICK_REPLY → injects payload "confermo"    (booking_reminder)
  | 'booking_cancel'     // QUICK_REPLY → injects payload "annulla prenotazione"
  | 'custom';            // no special runtime behavior

export type WabaTemplateButtonType = 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE' | 'FLOW';

export type WabaTemplateButton =
  | { type: 'QUICK_REPLY'; text: string; semantic_role?: ButtonSemanticRole }
  | { type: 'URL'; text: string; url: string; example?: string[]; semantic_role?: ButtonSemanticRole }
  | { type: 'PHONE_NUMBER'; text: string; phone_number: string; semantic_role?: ButtonSemanticRole }
  | { type: 'COPY_CODE'; example: string; semantic_role?: ButtonSemanticRole }
  | { type: 'FLOW'; text: string; semantic_role: 'booking_flow' };  // flow_id injected at send time from env

export type WabaTemplateComponent =
  | { type: 'HEADER'; format: 'TEXT'; text: string }                             // max 60 chars
  | { type: 'BODY'; text: string; example?: { body_text: string[][] } }          // max 768 chars; example.body_text[0] = sample values for {{N}}
  | { type: 'FOOTER'; text: string }                                              // max 60 chars
  | { type: 'BUTTONS'; buttons: WabaTemplateButton[] };                           // max 3 buttons

export type WabaTemplate = {
  id: string;                            // client-generated UUID
  name: string;                          // snake_case, unique per WABA, used in Meta API calls
  display_name: string;                  // human-readable label in the dashboard
  template_type: WabaTemplateType;       // purpose/context — drives structure and required buttons
  meta_template_id: string | null;       // assigned by Meta after submission
  meta_status: WabaTemplateStatus;
  rejection_reason: string | null;       // populated when meta_status = 'REJECTED'
  language: string;                      // e.g. 'it', 'en'
  category: WabaTemplateCategory;        // UTILITY or MARKETING — derived from template_type
  components: WabaTemplateComponent[];
  created_at: string;
  updated_at: string;
  last_synced_at: string | null;         // last time we polled/received status from Meta
};

// -- Main DB Types --

export type NotificationType = 'new_booking' | 'new_customer' | 'new_order' | 'whatsapp_limit_warning' | 'voice_otp_failed';

export type Notification = {
  id: string;
  organization_id: string;
  location_id: string | null;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type PushToken = {
  id: string;
  organization_id: string;
  profile_id: string | null;
  token: string;
  platform: 'ios' | 'android' | 'web';
  created_at: string;
  updated_at: string;
};

export type BookingSource = "whatsapp_auto" | "manual" | "web" | "phone" | "thefork" | "quandoo" | "opentable";
export type BookingSyncStatus = "synced" | "pending_push" | "conflict";

export type Booking = {
  id: string;
  organization_id: string;
  location_id: string;
  customer_id: string | null;
  table_id?: string | null;
  guest_name: string;
  guest_phone: string;
  guests_count: number;
  children_count?: string | null;
  allergies?: string | null;
  google_event_id?: string | null;
  booking_time: string;
  booking_end_time?: string | null;
  status: "pending" | "confirmed" | "cancelled" | "no_show" | "arrived";
  source: BookingSource;
  notes: string | null;
  created_at: string;
  external_id?: string | null;          // Reservation ID on the external platform
  sync_status?: BookingSyncStatus | null;
};

export type CallbackRequest = {
  id: string;
  location_id: string;
  phone_number: string;
  status: "pending" | "completed" | "archived";
  notes: string | null;
  created_at: string;
  completed_at: string | null;
};

export type CustomerMetadata = {
  thefork_id?: string;      // TheFork guest identifier (from phone lookup or webhook)
  quandoo_id?: string;      // Quandoo guest identifier
  opentable_id?: string;    // OpenTable guest identifier
  dietary_preferences?: string[];
  seating_preferences?: string[];
  [key: string]: unknown;
};

export type Customer = {
  id: string;
  organization_id: string;
  location_id: string;
  phone_number: string;
  name: string;
  email?: string | null;    // Used for matching with TheFork/Quandoo/OpenTable guest profiles
  total_visits: number;
  last_visit: string;
  tags: string[];
  org_tags: string[];
  metadata: CustomerMetadata;
  created_at: string;
  bsuid: string | null;
};

export type Feedback = {
  id: string;
  organization_id: string;
  profile_id: string;
  type: string;
  reason: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type UserFeedbackType = 'feature_request' | 'bug_report' | 'general' | 'praise';
export type UserFeedbackStatus = 'open' | 'reviewing' | 'planned' | 'in_progress' | 'done' | 'wont_fix';
export type UserFeedbackPriority = 'low' | 'medium' | 'high' | 'critical';

export type UserFeedback = {
  id: string;
  organization_id: string;
  profile_id: string | null;
  type: UserFeedbackType;
  title: string;
  description: string | null;
  status: UserFeedbackStatus;
  priority: UserFeedbackPriority;
  admin_response: string | null;
  admin_responded_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
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
  telnyx_requirement_group_id?: string | null;
  telnyx_bundle_request_id?: string | null;
  regulatory_status?: string | null;
  regulatory_rejection_reason?: string | null;
  regulatory_documents_data?: Record<string, unknown> | null;
  activation_status: string;
  created_at: string;
  branding: LocationBranding | null;
  active_menu_id: string | null;
  meta_phone_id: string;
  display_name_status: string;
  voice_forwarding_number?: string | null;
  max_covers_per_shift: number | null;
  standard_reservation_duration: number | null;
  cover_price: number | null;
  meta_verification_otp: string | null;
  is_branding_completed: boolean;
  is_test_completed: boolean;
  business_connectors?: string | null; // Encrypted BusinessConnectors JSON (AES-256-GCM)
  thefork_restaurant_id?: string | null;
  voice_otp_retry_count?: number;
  waba_templates: WabaTemplate[];      // Custom WABA templates for this location (10/30/50 per tier)
};

export type MenuLocation = {
  menu_id: string;
  location_id: string;
  is_active: boolean;
  daily_from: string | null;  // HH:mm — show only from this time
  daily_until: string | null; // HH:mm — show only until this time
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

export type AddonConfig = {
  extra_staff: number;
  extra_contacts_wa: number;
  extra_storage_mb: number;
  extra_locations: number;
  extra_kb_chars: number;
  extra_analytics: number;
  extra_connections: number;
};

export type PlanLimits = {
  max_locations: number;
  max_staff: number;
  max_bookings: number;
  wa_contacts: number;
  max_menus: number;
  max_zones: number;
  storage_mb: number;
  ai_tier: "basic" | "medium" | "pro";
  analytics: "basic" | "advanced";
};

export type UxSettings = {
  localization: {
    currency: "EUR" | "USD" | "GBP" | "CHF";
    language: "it" | "en" | "sp" | "de" | "fr";
    timezone: "Europe/Rome" | "Europe/London" | "Europe/Berlin" | "Europe/Andorra";
  };
  notifications: {
    preferences: {
      push_new_order: boolean;
      push_new_booking: boolean;
      email_plan_ending: boolean;
      email_limit_reached: boolean;
      email_monthly_recap: boolean;
    },
    personal_email: string;
    personal_phone: string;
  }
}

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
  current_billing_cycle_start: string;
  /** Effective WA cap = base plan wa_contacts + addons_config.extra_contacts_wa */
  usage_cap_whatsapp: number;
  /** Extra capacities purchased via add-on subscription items */
  addons_config: AddonConfig;
  /** Total storage used across all buckets, in bytes */
  total_storage_used: number;
  ux_settings: UxSettings
};

export type SubscriptionPlanLimits = PlanLimits;

export type Profile = {
  id: string;
  organization_id: string;
  full_name: string;
  role: "owner" | "admin" | "staff";
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
  min_capacity: number | null;
  max_capacity: number | null;
  created_at: string;
};

export type RestaurantZone = {
  id: string;
  location_id: string;
  name: string;
  width: number;
  height: number;
  blocked_from: string | null;
  blocked_until: string | null;
  blocked_reason: string | null;
  created_at: string;
};

export type SpecialClosure = {
  id: string;
  location_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  created_at: string;
};

export type StarredPage = {
  id: string;
  profile_id: string;
  url: string;
  title: string;
  created_at: string;
};

export type SubscriptionPlan = {
  id: string;
  stripe_price_id: string;
  name: string;
  key: string;
  limits: PlanLimits;
  created_at: string;
};

export type Transaction = {
  id: string;
  organization_id: string;
  amount: number;
  type: "subscription" | "usage" | "topup" | "bonus" | "refund" | "adjustment";
  description: string;
  reference_id?: string;
  metadata: Record<string, unknown>;
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
  recurring_schedule: Record<string, unknown> | null;
  visit_threshold: number | null;
  is_active: boolean;
  priority: number;
  stackable: boolean;
  notify_via_whatsapp: boolean;
  created_at: string;
  updated_at: string;
  // Direct array fields
  target_location_ids: string[];
  target_menu_ids: string[];
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

export type GoogleCalendarResource = {
  isGoogleEvent: true;
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource: Booking | GoogleCalendarResource;
};

// -- Server Action State Types --

export type CreateBookingState = {
  message?: string;
  error?: string | null;
  success?: boolean;
  bookingId?: string;
};
