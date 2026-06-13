"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { clerkModalAppearance } from "@/lib/clerk-appearance";

export default function ClientClerkProvider({ children }: { children: ReactNode }) {
  return <ClerkProvider appearance={clerkModalAppearance}>{children}</ClerkProvider>;
}
