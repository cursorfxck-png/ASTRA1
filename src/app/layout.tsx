import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";

import { clerkModalAppearance } from "@/lib/clerk-appearance";

import "./globals.css";

export const metadata: Metadata = {
  title: "ASTRA",
  description: "ASTRA landing page with a built-in CMS, language switching, and auth-gated cart access."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClerkProvider appearance={clerkModalAppearance}>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
