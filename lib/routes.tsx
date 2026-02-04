import { BookCopy, Calendar, ChartSpline, CreditCard, Home, ListTodo, LogOut, Settings, Store, Users } from "lucide-react"
import { GiTable } from "react-icons/gi";
import { MdMenuBook } from "react-icons/md";
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
      label: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
    {
      label: "Prenotazioni",
      items: [
        {
          title: "Prenotazioni",
          url: "/reservations",
          icon: ListTodo,
        },
        {
          title: "Calendario",
          url: "/calendar",
          icon: Calendar,
        },
      ],
    },
    {
      label: "Gestione",
      items: [
        {
          title: "Gestione Sala",
          url: "/manage-seats",
          icon: GiTable,
        },
        {
          title: "Gestione Menù",
          url: "/manage-menus",
          icon: MdMenuBook,
        },
      ],
    },
    {
      label: "Altro",
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
          title: "Impostazioni Sede",
          url: "/settings",
          icon: Settings,
        },
      ],
    },
  ] as RouteEntry[],
  organization: [
    {
      label: "Organizzazione",
      items: [
        {
          title: "Gestisci le sedi",
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
      label: "Altro",
      items: [
        {
          title: "Guida Veloce",
          url: "/faq",
          icon: BookCopy,
        },
      ],
    },
  ] as RouteEntry[],
}