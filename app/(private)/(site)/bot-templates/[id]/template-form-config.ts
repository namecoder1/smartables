import type { LucideIcon } from "lucide-react";
import {
  PhoneCall, PhoneOff, CalendarClock, Bell, Tag, Megaphone, Pencil,
} from "lucide-react";
import type {
  WabaTemplateButton,
  WabaTemplateType,
  WabaTemplateButtonType,
  ButtonSemanticRole,
} from "@/types/general";

export const CHAR_LIMITS = { HEADER: 60, BODY: 768, FOOTER: 60, BUTTON: 25 } as const;

export const LANGS = [
  { value: "it", label: "Italiano" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
];

export type TemplateTypeConfig = {
  label: string;
  description: string;
  costPerConv: string;
  requiredRoles: ButtonSemanticRole[];
  icon: LucideIcon;
  warning?: string;
};

export const TEMPLATE_TYPE_CONFIG: Record<WabaTemplateType, TemplateTypeConfig> = {
  recovery_open: {
    label: "Recupero — Aperto",
    description: "Sostituisce il template di sistema quando il locale è APERTO e riceve una chiamata persa.",
    costPerConv: "€0.0248/conv",
    requiredRoles: ["supplier_flag", "callback_request", "booking_flow"],
    icon: PhoneCall,
  },
  recovery_closed: {
    label: "Recupero — Chiuso",
    description: "Sostituisce il template di sistema quando il locale è CHIUSO e riceve una chiamata persa.",
    costPerConv: "€0.0248/conv",
    requiredRoles: ["menu_link", "booking_flow"],
    icon: PhoneOff,
  },
  booking_reminder: {
    label: "Reminder Prenotazione",
    description: "Inviato 24h prima della prenotazione al posto del template di sistema.",
    costPerConv: "€0.0248/conv",
    requiredRoles: ["booking_confirm", "booking_cancel"],
    icon: CalendarClock,
  },
  service_update: {
    label: "Aggiornamento Servizio",
    description: "Comunicazioni operative ai clienti: orari, avvisi, conferme. Verifica AI attiva.",
    costPerConv: "€0.0248/conv",
    requiredRoles: [],
    icon: Bell,
  },
  promotion: {
    label: "Promozione",
    description: "Offerte speciali, sconti, promozioni stagionali. Categoria MARKETING.",
    costPerConv: "€0.0572/conv",
    requiredRoles: [],
    icon: Tag,
    warning: "I template MARKETING costano più del doppio rispetto a UTILITY. Assicurati che sia necessario.",
  },
  news: {
    label: "Novità",
    description: "Nuovi piatti, eventi, notizie del locale. Categoria MARKETING.",
    costPerConv: "€0.0572/conv",
    requiredRoles: [],
    icon: Megaphone,
    warning: "I template MARKETING costano più del doppio rispetto a UTILITY. Assicurati che sia necessario.",
  },
  custom: {
    label: "Template Personalizzato",
    description: "Struttura libera. Il gate AI verifica la conformità alle policy UTILITY prima dell'invio.",
    costPerConv: "€0.0248/conv",
    requiredRoles: [],
    icon: Pencil,
  },
};

export const ROLE_DEFAULT_TEXT: Record<ButtonSemanticRole, string> = {
  supplier_flag:    "Sono un fornitore",
  callback_request: "Richiamatemi",
  booking_flow:     "Prenota un tavolo",
  menu_link:        "Vedi il menu",
  booking_confirm:  "Confermo la presenza",
  booking_cancel:   "Non ci sarò",
  custom:           "",
};

export const ROLE_LABEL: Record<ButtonSemanticRole, string> = {
  supplier_flag:    "Tag fornitore",
  callback_request: "Richiesta richiamata",
  booking_flow:     "Apre flow prenotazione",
  menu_link:        "Invia link menu",
  booking_confirm:  "Conferma prenotazione",
  booking_cancel:   "Annulla prenotazione",
  custom:           "Personalizzato",
};

export const BUTTON_TYPE_LABELS: Partial<Record<WabaTemplateButtonType, string>> = {
  QUICK_REPLY:  "Risposta rapida",
  URL:          "Visita sito web",
  PHONE_NUMBER: "Chiama numero",
  COPY_CODE:    "Copia codice offerta",
};

export type ButtonFormState = {
  type: WabaTemplateButtonType;
  text: string;
  url: string;
  url_example: string;
  phone_number: string;
  copy_code_example: string;
  semantic_role: ButtonSemanticRole;
  is_locked: boolean;
};

export function templateButtonToFormState(
  b: WabaTemplateButton,
  requiredRoles: ButtonSemanticRole[],
): ButtonFormState {
  const role = b.semantic_role ?? "custom";
  const isLocked = requiredRoles.includes(role as ButtonSemanticRole);
  const base = {
    url: "", url_example: "", phone_number: "", copy_code_example: "",
    semantic_role: role as ButtonSemanticRole,
    is_locked: isLocked,
  };
  if (b.type === "FLOW")         return { ...base, type: "FLOW",         text: b.text };
  if (b.type === "QUICK_REPLY")  return { ...base, type: "QUICK_REPLY",  text: b.text };
  if (b.type === "URL")          return { ...base, type: "URL",          text: b.text, url: b.url, url_example: b.example?.[0] ?? "" };
  if (b.type === "PHONE_NUMBER") return { ...base, type: "PHONE_NUMBER", text: b.text, phone_number: b.phone_number };
  return { ...base, type: "COPY_CODE", text: "", copy_code_example: (b as Extract<WabaTemplateButton, { type: "COPY_CODE" }>).example };
}

export function formStateToButton(b: ButtonFormState): WabaTemplateButton {
  if (b.type === "FLOW")         return { type: "FLOW", text: b.text, semantic_role: "booking_flow" };
  if (b.type === "QUICK_REPLY")  return { type: "QUICK_REPLY", text: b.text, semantic_role: b.semantic_role };
  if (b.type === "PHONE_NUMBER") return { type: "PHONE_NUMBER", text: b.text, phone_number: b.phone_number, semantic_role: b.semantic_role };
  if (b.type === "COPY_CODE")    return { type: "COPY_CODE", example: b.copy_code_example, semantic_role: b.semantic_role };
  const btn: Extract<WabaTemplateButton, { type: "URL" }> = { type: "URL", text: b.text, url: b.url, semantic_role: b.semantic_role };
  if (b.url.includes("{{1}}") && b.url_example) btn.example = [b.url_example];
  return btn;
}

export function getDefaultButtonsForType(type: WabaTemplateType): ButtonFormState[] {
  return TEMPLATE_TYPE_CONFIG[type].requiredRoles.map((role) => ({
    type: (role === "booking_flow" ? "FLOW" : "QUICK_REPLY") as WabaTemplateButtonType,
    text: ROLE_DEFAULT_TEXT[role],
    url: "", url_example: "", phone_number: "", copy_code_example: "",
    semantic_role: role,
    is_locked: true,
  }));
}
