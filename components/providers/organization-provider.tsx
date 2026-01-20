"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface Organization {
  id: string;
  name: string;
  credits: number;
  activation_status: string;
  [key: string]: any;
}

interface OrganizationContextType {
  organization: Organization | null;
  setOrganization: (org: Organization) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({
  children,
  initialOrganization,
}: {
  children: ReactNode;
  initialOrganization: Organization | null;
}) {
  const [organization, setOrganization] = useState<Organization | null>(initialOrganization);

  useEffect(() => {
    if (initialOrganization && (!organization || organization.id !== initialOrganization.id)) {
      setOrganization(initialOrganization);
    }
  }, [initialOrganization]);

  return (
    <OrganizationContext.Provider value={{ organization, setOrganization }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
}
