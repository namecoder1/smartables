import { BookCopy, Calendar, ChartSpline, BadgeQuestionMark, CreditCard, Home, Settings, Store, Users, Building2, TrendingUp, Activity, ShieldCheck, MessageSquare, Package, Mail } from "lucide-react"
import { PiForkKnifeFill } from "react-icons/pi";
import { GrConnect } from "react-icons/gr";
import { RiTeamFill } from "react-icons/ri";
import { IoBookSharp } from "react-icons/io5";
import { BsShieldLock } from "react-icons/bs";
import { LuCalendarCheck, LuNotebookPen, LuBookOpenText, LuLayoutDashboard, LuBotMessageSquare, LuMessagesSquare } from "react-icons/lu";
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
      label: "Inbox",
      icon: LuMessagesSquare,
      url: "/inbox",
    },
    {
      label: "Analitiche",
      icon: ChartSpline,
      url: "/analytics",
    },
    {
      label: "Gestione sede",
      icon: PiForkKnifeFill,
      items: [
        {
          title: "Le tue Mappe",
          url: "/areas-management",
          icon: LiaTableSolid,
        },
        {
          title: "Impostazioni & Dettagli",
          url: "/site-settings",
          icon: LiaTableSolid,
        },
        {
          title: "Connessioni",
          url: "/connections",
          icon: GrConnect,
        },
        {
          title: "Modulistica & Attivazione",
          url: "/compliance",
          icon: LiaTableSolid,
        }
      ]
    },
    {
      label: 'Gestione Whatsapp',
      icon: FaWhatsapp,
      items: [
        {
          title: "Impostazioni Bot",
          url: "/bot-settings",
          icon: FaWhatsapp,
        },
        {
          title: "Template Bot",
          url: "/bot-templates",
          icon: FaWhatsapp,
        },
        {
          title: "Memoria Bot",
          url: "/bot-memory",
          icon: LuBotMessageSquare,
        },
      ]
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
          title: "Limiti",
          url: "/limits",
          icon: BsShieldLock,
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
    label: "Dashboard",
    url: "/manage",
    icon: Home,
  },
  {
    label: "Organizzazioni",
    url: "/organizations",
    icon: Building2,
  },
  {
    label: "Revenue",
    url: "/revenue",
    icon: TrendingUp,
  },
  {
    label: "System Health",
    url: "/health",
    icon: Activity,
  },
  {
    label: "Addon Management",
    url: "/addons",
    icon: Package,
  },
  {
    label: "Mailing",
    url: "/mailing",
    icon: Mail,
  },
] as RouteEntry[]