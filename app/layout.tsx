import type { Metadata } from "next";
import "./globals.css";
import { RoleProvider } from "@/components/role-provider";
import { RoleSwitcher } from "@/components/role-switcher";

export const metadata: Metadata = {
  title: "Seat Allocation System",
  description: "Seat allocation and project mapping for employees",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="font-sans">
      <body className="min-h-screen bg-gray-50 antialiased">
        <RoleProvider>
          <header className="border-b border-gray-200 bg-white px-6 py-4">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-900">
                Ethara Seat Allocation & Project Mapping System
              </h1>
              <RoleSwitcher />
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
        </RoleProvider>
      </body>
    </html>
  );
}