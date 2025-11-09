"use client";

import { ClerkProvider } from "@clerk/nextjs";
import React from "react";

export default function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  // NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must be set in your environment
  return <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>{children}</ClerkProvider>;
}
