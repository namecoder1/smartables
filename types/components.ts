export interface SettingsViewProps {
  locations: any[];
  menus: any[]; // Deep menu structure
  organizationId: string;
}

export interface Branding {
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

export interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
  shape?: "circle" | "square";
}

export interface Location {
  id: string;
  name: string;
  address: string | null;
  phone_number: string | null;
  menu_link: string | null;
  branding: Branding | null;
  seats: number;
  telnyx_phone_number?: string | null;
  telnyx_connection_id?: string | null;
}

export interface InfoTabProps {
  location: Location | undefined;
}

export interface Menu {
  id: string;
  name: string;
  description: string | null;
  pdf_url?: string | null;
  is_active: boolean;
  is_default: boolean;
  organization_id: string;
  // categories will be fetched inside editor or passed down if fetched eagerly
  categories?: any[];
  menu_locations?: {
    location_id: string;
    is_active: boolean;
    locations?: {
      slug: string;
      name: string;
    };
  }[];
}

export interface MenusTabProps {
  menus: Menu[];
  organizationId: string;
  locations: Location[];
}
