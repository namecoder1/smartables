import { BookCopy, Calendar, ChartSpline, BadgeQuestionMark, CreditCard, Home, ListTodo, LogOut, Settings, Store, ToolCase, Users, MessageSquare } from "lucide-react"
import { GiTable } from "react-icons/gi";
import { PiForkKnifeFill, PiToolboxFill, PiListChecksFill } from "react-icons/pi";
import { MdDashboard, MdMenuBook } from "react-icons/md";
import { MdDashboardCustomize } from "react-icons/md";
import { RiMegaphoneLine, RiTeamFill } from "react-icons/ri";
import { IoBookSharp } from "react-icons/io5";
import { GrDocumentUser } from "react-icons/gr";
import { LuListTodo, LuCalendarCheck, LuNotebookPen, LuBookOpenText, LuLayoutDashboard } from "react-icons/lu";
import { LiaTableSolid } from "react-icons/lia";
import { FaUsers, FaUsersLine, FaWhatsapp } from "react-icons/fa6";
import { TbRosetteDiscount } from "react-icons/tb";

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
      label: 'Dashboard',
      icon: LuLayoutDashboard,
      url: '/dashboard',
    },
    {
      label: "Prenotazioni",
      icon: LuCalendarCheck,
      items: [
        {
          title: "Mappa prenotazioni",
          url: "/area-management",
          icon: LiaTableSolid,
        },
        {
          title: "Vista prenotazioni",
          url: "/reservations-management",
          icon: FaUsersLine,
        },
        {
          title: "Calendario prenotazioni",
          url: "/reservations-calendar",
          icon: Calendar,
        },
      ],
    },
    {
      label: "Menù",
      icon: LuBookOpenText,
      url: "/menus-management",
    },
    {
      label: "Clienti",
      icon: Users,
      url: "/clients",
    },
    {
      label: "Ordini",
      icon: LuNotebookPen,
      url: "/orders",
    },
    {
      label: "Analitiche",
      icon: ChartSpline,
      url: "/analytics",
    },
    {
      label: "Gestione ristorante",
      icon: PiForkKnifeFill,
      items: [
        {
          title: "Mappe ristorante",
          url: "/areas-management",
          icon: LiaTableSolid,
        },
        {
          title: "Dettagli ristorante",
          url: "/site-settings",
          icon: LiaTableSolid,
        },
        {
          title: "Modulistica ristorante",
          url: "/compliance",
          icon: LiaTableSolid,
        }
      ]
    },
    {
      label: "Gestione WhatsApp",
      icon: FaWhatsapp,
      url: "/whatsapp-management",
    },
    {
      label: "Collaboratori",
      icon: FaUsers,
      url: "/collaborators-management",
    },
    {
      label: "Promozioni",
      icon: TbRosetteDiscount,
      url: "/promotions",
    },
  ] as RouteEntry[],
  organization: [
    {
      label: "Gestione Organizzazione",
      icon: RiTeamFill,
      items: [
        {
          title: "Gestione sedi",
          url: "/activities-management",
          icon: Store,
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