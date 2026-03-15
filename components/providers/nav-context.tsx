"use client";

/**
 * NavDataContext — provides shell-level navigation data to client components.
 *
 * Data is fetched once in the server layout and injected here via
 * <NavDataProvider>. Any client component in the private layout can read it
 * with `useNavData()` instead of receiving the values through prop drilling.
 *
 * Values provided:
 *   - organizationId     — current org UUID
 *   - activationStatus   — location activation_status (for compliance UI)
 *   - managedAccountId   — Telnyx managed account id (for compliance UI)
 *   - complianceStatus   — location regulatory_status (for compliance UI)
 *   - starredPages       — list of pages starred by the user
 */

import { createContext, useContext } from "react";

export type StarredPage = { id: string; url: string; title: string };

interface NavData {
  organizationId?: string;
  activationStatus?: string;
  managedAccountId?: string | null;
  complianceStatus?: string;
  starredPages: StarredPage[];
}

const NavDataContext = createContext<NavData>({
  starredPages: [],
});

export function NavDataProvider({
  children,
  ...value
}: NavData & { children: React.ReactNode }) {
  return (
    <NavDataContext.Provider value={value}>
      {children}
    </NavDataContext.Provider>
  );
}

/** Read nav-level data in any client component inside the private layout. */
export function useNavData() {
  return useContext(NavDataContext);
}
