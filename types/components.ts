import { SanityFaq } from "@/utils/sanity/queries";
import { Menu, Location, Customer, Booking } from "./general";

export interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
  shape?: "circle" | "square";
}

export type BookingWithCustomer = Booking & {
  customer?: Customer | null;
};


export interface MenusViewProps {
  menus: Menu[];
  limits: any;
  organizationId: string;
  locations: Location[];
  faqs: SanityFaq[]
}
