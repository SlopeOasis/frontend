"use client"

import Link from "next/link"
import { Search } from "lucide-react"
import Image from "next/image"
import React, { useEffect, useRef, useState } from "react";
import { SignInButton, SignedIn, SignedOut, useUser, useSignIn, SignInWithMetamaskButton, useAuth } from "@clerk/nextjs";
import { DebugBackend } from "./debug-backend";
import { useRouter } from "next/navigation";

export function Header() {
  return (
    <header className="border-b border-border bg-background sticky top-0 z-50">
      <DebugBackend />
      <div className="container mx-auto px-4 py-4">
        <AutoRegister />
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-4Gi5slRBIrpvjeimKEmwEAbgjBSOX1.png"
              alt="SlopeOasis"
              width={40}
              height={40}
              className="rounded-full"
            />
          </Link>

          {/* Search Bar */}
          <SearchBar />

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* SignedOut: show Connect button that opens Clerk sign-in modal */}
            <SignedOut>
              <ConnectWithMetaMask />
            </SignedOut>

            {/* SignedIn: show profile image (from Clerk) that links to /profile */}
            <SignedIn>
          <UserProfileLink />
            </SignedIn>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-4 mt-4 text-sm overflow-x-auto">
          {[{name:"Art", tag:"ART"}, {name:"Music", tag:"MUSIC"}, {name:"Videos", tag:"VIDEO"}, {name:"Code", tag:"CODE"}, {name:"Templates", tag:"TEMPLATE"}, {name:"Photos", tag:"PHOTO"}, {name:"3D_Models", tag:"MODEL_3D"}, {name:"Fonts", tag:"FONT"}, {name:"Other", tag:"OTHER"}].map((category) => (
            <Link key={category.tag} href={`/showcase/${category.tag.toLowerCase()}`}>
              <button key={category.tag} className="px-3 py-1 whitespace-nowrap hover:bg-secondary rounded transition-colors">
                {category.name}
              </button>
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}

function AutoRegister() {//pri vsaki registraciji se pokliče, in doda novega userja v bazo
  const { user } = useUser();
  const { getToken } = useAuth();
  const didRegister = useRef(false);

  useEffect(() => {
    if (!user || didRegister.current) return;

    (async () => {
      try {
        const token = await getToken({ template: "backendVerification" });
        if (!token) {
          console.warn("No session token; skipping auto-register");
          return;
        }
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"}/users`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          console.log("Auto-registered user", await res.json());
        } else {
          console.error("Auto-register failed", res.status, await res.text());
        }
      } catch (e) {
        console.error("Auto-register error", e);
      } finally {
        didRegister.current = true; // avoid repeated attempts in this session
      }
    })();
  }, [user, getToken]);

  return null;
}

function UserProfileLink() {
  const { user } = useUser();
  const img = user?.imageUrl || 
    'https://www.gravatar.com/avatar/?d=mp';
  return (
    <Link href="/profile" className="p-2 hover:bg-secondary rounded-full transition-colors">
      <Image src={img} alt="profile" width={32} height={32} className="rounded-full" />
    </Link>
  )
}

function ConnectWithMetaMask() {
  return (
    <>
      <SignInButton mode="modal">
        <button className="ml-2 px-3 py-2 border border-border rounded hover:bg-secondary transition-colors text-sm">Sign in</button>
      </SignInButton>
    </>
  )
}

function SearchBar() {
  const [query, setQuery] = useState("")
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search the slope . . ."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </form>
  )
}
