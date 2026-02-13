import { BookCopy, Calendar, ChartSpline, BadgeQuestionMark, CreditCard, Home, ListTodo, LogOut, Settings, Store, ToolCase, Users } from "lucide-react"
import { GiTable } from "react-icons/gi";
import { PiForkKnifeFill, PiToolboxFill } from "react-icons/pi";
import { MdMenuBook } from "react-icons/md";
import { MdDashboardCustomize } from "react-icons/md";
import { HiDotsHorizontal } from "react-icons/hi";
import { RiTeamFill } from "react-icons/ri";
import { IoBookSharp } from "react-icons/io5";
import { GrDocumentUser } from "react-icons/gr";

export type RouteItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Gruppo collapsibile con sottomenu
export type RouteGroup = {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  items: RouteItem[];
}

// Link singolo senza sottomenu
export type RouteSingle = {
  label: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Può essere un gruppo o un link singolo
export type RouteEntry = RouteGroup | RouteSingle;

// Type guard per distinguere tra gruppo e singolo
export const isRouteGroup = (entry: RouteEntry): entry is RouteGroup => {
  return 'items' in entry && Array.isArray(entry.items);
}

export const routes = {
  platform: [
    {
      label: "Prenotazioni",
      icon: PiForkKnifeFill,
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: Home,
        },
        {
          title: "Gestione prenotazioni",
          url: "/reservations",
          icon: ListTodo,
        },
        {
          title: "Calendario prenotazioni",
          url: "/calendar",
          icon: Calendar,
        },
      ],
    },
    {
      label: "Gestione",
      icon: MdDashboardCustomize,
      items: [
        {
          title: "Gestione sale",
          url: "/manage-seats",
          icon: GiTable,
        },
        {
          title: "Gestione menù",
          url: "/manage-menus",
          icon: MdMenuBook,
        },
      ],
    },
    {
      label: "Strumenti",
      icon: PiToolboxFill,
      items: [
        {
          title: "Analitiche",
          url: "/analytics",
          icon: ChartSpline,
        },
        {
          title: "Modulistica",
          url: "/compliance",
          icon: GrDocumentUser,
        },
        {
          title: "Impostazioni sede",
          url: "/settings",
          icon: Settings,
        },
      ],
    },
  ] as RouteEntry[],
  organization: [
    {
      label: "Organizzazione",
      icon: RiTeamFill,
      items: [
        {
          title: "Gestisci sedi",
          url: "/manage-activities",
          icon: Store,
        },
        {
          title: "Gestisci collaboratori",
          url: "/manage-collaborators",
          icon: Users,
        },
        {
          title: "Fatturazione",
          url: "/billing",
          icon: CreditCard,
        },
        {
          title: "Impostazioni generali",
          url: "/general-settings",
          icon: Settings,
        },
      ],
    },
    {
      label: "Impara",
      icon: IoBookSharp,
      items: [
        {
          title: "Guide pratiche",
          url: "/guides",
          icon: BookCopy,
        },
        {
          title: "FAQ",
          url: "/faqs",
          icon: BadgeQuestionMark,
        },
      ],
    },
  ] as RouteEntry[],
}

export const adminRoutes = [
  {
    label: "Gestisci",
    url: "/manage",
    icon: Home,
  },
] as RouteEntry[]