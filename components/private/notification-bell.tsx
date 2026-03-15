"use client";

import { Bell, Phone, ExternalLink, ShoppingBag, Calendar, Users, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import type { Notification } from "@/types/general";

interface NotificationBellProps {
  notifications: Notification[];
  pendingCallbacks: number;
}

const NOTIFICATION_ICONS = {
  new_booking: { Icon: Calendar, color: "text-blue-500", bg: "bg-blue-500/10" },
  new_customer: { Icon: Users, color: "text-green-500", bg: "bg-green-500/10" },
  new_order: { Icon: ShoppingBag, color: "text-purple-500", bg: "bg-purple-500/10" },
  whatsapp_limit_warning: { Icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10" },
} as const;

export function NotificationBell({ notifications, pendingCallbacks }: NotificationBellProps) {
  const totalCount = notifications.length + pendingCallbacks;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative group p-1 bg-card/10 data-[state=open]:border-primary/60 border-2 rounded-lg hover:bg-primary/10 border-border/10 hover:border-primary/60">
        <Bell
          size={26}
          className="text-white group-data-[state=open]:text-primary group-hover:text-primary/90"
        />
        {totalCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold animate-in zoom-in-50">
            {totalCount > 99 ? "99+" : totalCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-3 py-2">
          <p className="text-sm font-semibold">Notifiche</p>
        </div>
        <DropdownMenuSeparator />

        {totalCount === 0 ? (
          <div className="px-3 py-6 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nessuna notifica</p>
          </div>
        ) : (
          <>
            {pendingCallbacks > 0 && (
              <DropdownMenuItem asChild>
                <Link
                  href="/whatsapp-management"
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div className="p-1.5 bg-orange-500/10 rounded-lg shrink-0">
                    <Phone className="h-4 w-4 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Da richiamare</p>
                    <p className="text-xs text-muted-foreground">
                      {pendingCallbacks}{" "}
                      {pendingCallbacks === 1 ? "richiesta" : "richieste"}{" "}
                      in attesa
                    </p>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </Link>
              </DropdownMenuItem>
            )}

            {notifications.map((notif) => {
              const config = NOTIFICATION_ICONS[notif.type] ?? NOTIFICATION_ICONS.new_booking;
              const { Icon, color, bg } = config;
              return (
                <DropdownMenuItem key={notif.id} asChild>
                  <Link
                    href={notif.link ?? "#"}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <div className={`p-1.5 ${bg} rounded-lg shrink-0`}>
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notif.title}</p>
                      {notif.body && (
                        <p className="text-xs text-muted-foreground truncate">
                          {notif.body}
                        </p>
                      )}
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
