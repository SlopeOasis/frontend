//ni zares nikol uporabljenaa stran, ker se avtomatsko registrira v headerju ob signinu



"use client";

import React, { useEffect } from "react";
import { SignInButton, SignedIn, SignedOut, useUser, SignOutButton, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  // auto-register when user signs in
  useEffect(() => {
    if (!user) return;
    (async () => {
      // determine wallet address from Clerk user object
      // @ts-ignore
      const wallet = user?.primaryWalletAddress || (user?.externalAccounts?.[0]?.address);
      if (!wallet) {
        console.warn("No wallet address found on Clerk user. Ensure wallets are enabled in Clerk and user connected a wallet.");
        return;
      }

      try {
        const token = await getToken();
        // send clerkId as well as walletAddress so backend can create by clerkId if verification is not active
        const body = { clerkId: user.id, walletAddress: wallet };
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"}/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          const data = await res.json();
          console.log("Registered/synced user", data);
          // redirect to profile page after successful registration
          router.push("/profile");
        } else {
          console.error("Failed to register user", res.status, await res.text());
        }
      } catch (e) {
        console.error("Registration failed", e);
      }
    })();
  }, [user, getToken, router]);

  return (
    <div style={{ padding: 24 }}>
      <h1>Auth</h1>
      <SignedOut>
        <SignInButton mode="modal">
          <button>Sign in (Clerk)</button>
        </SignInButton>
      </SignedOut>

      <SignedIn>
        <div>
          <p>Signed in as: {user?.fullName || user?.primaryEmailAddress?.emailAddress || user?.id}</p>
          <p>Wallet (approx): {user?.web3Wallets?.[0]?.web3Wallet}</p>
          <SignOutButton>
            <button>Sign out</button>
          </SignOutButton>
        </div>
      </SignedIn>
    </div>
  );
}
