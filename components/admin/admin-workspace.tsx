"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

const AdminFooterSlotContext = createContext<HTMLElement | null>(null);

export function AdminWorkspace({ children }: { children: ReactNode }) {
  const [footerEl, setFooterEl] = useState<HTMLElement | null>(null);

  return (
    <AdminFooterSlotContext.Provider value={footerEl}>
      <main id="admin-main" className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8">{children}</div>
        <div ref={setFooterEl} className="shrink-0" />
      </main>
    </AdminFooterSlotContext.Provider>
  );
}

export function useAdminFooterSlot() {
  return useContext(AdminFooterSlotContext);
}
