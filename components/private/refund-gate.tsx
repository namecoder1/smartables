"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Gate component that blocks refunded/canceled users from accessing any page
 * except /billing and /profile. Redirects to /billing and shows a banner.
 */
export default function RefundGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isBilling = pathname === "/billing" || pathname.startsWith("/billing");
  const isProfile = pathname === "/profile" || pathname.startsWith("/profile");
  const isAllowed = isBilling || isProfile;

  useEffect(() => {
    if (!isAllowed) {
      router.replace("/billing");
    }
  }, [pathname, isAllowed, router]);

  return (
    <>
      <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 px-4 py-3 flex items-center gap-3">
        <div className="bg-amber-100 dark:bg-amber-900/50 p-1.5 rounded-md shrink-0">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <span className="font-semibold">Abbonamento cancellato.</span>{" "}
          Scegli un piano per riattivare il servizio e accedere a tutte le funzionalità.
        </p>
      </div>
      {isAllowed ? children : null}
    </>
  );
}
