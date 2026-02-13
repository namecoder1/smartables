import {
  Settings,
  LayoutDashboard,
  UtensilsCrossed,
  Phone,
  CalendarCheck,
  ChartSpline,
  BookOpen,
  FileText,
  Users,
  ShieldCheck,
  Building2,
  CreditCard,
  Bell,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Settings,
  LayoutDashboard,
  UtensilsCrossed,
  Phone,
  CalendarCheck,
  ChartSpline,
  BookOpen,
  FileText,
  Users,
  ShieldCheck,
  Building2,
  CreditCard,
  Bell,
};

export function getGuideIcon(name: string | undefined): LucideIcon {
  if (!name) return FileText;
  return iconMap[name] ?? FileText;
}
