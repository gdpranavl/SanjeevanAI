// components/app-layout.tsx
// This component wraps your pages to provide the consistent sidebar and header.

import React from "react";
import { AppSidebar } from "@/components/app-sidebar"; // Assuming this component exists
import { SiteHeader } from "@/components/site-header";   // Assuming this component exists
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"; // Assuming these exist

type AppLayoutProps = {
  children: React.ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 flex-col p-4 md:p-8 pt-6 bg-background text-foreground">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
