"use client"

import { Header } from "@/components/header"
import { ProductGrid } from "@/components/product-grid"
import { mockProducts } from "@/lib/mock-data"
import { User as UserIcon } from "lucide-react"
import React, { useRef, useState, useEffect } from "react"
import { useUser, useAuth, SignInButton } from "@clerk/nextjs"

export default function ProfilePage() {
  const userProducts = mockProducts.slice(0, 4)
  const { user, isLoaded } = useUser()
  const { getToken, signOut } = useAuth()

  const [editingNickname, setEditingNickname] = useState(false)
  const [nicknameInput, setNicknameInput] = useState("")
  const [currentNickname, setCurrentNickname] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"

  const startEditNickname = () => {
    setNicknameInput(currentNickname ?? "")
    setEditingNickname(true)
  }

  // Fetch nickname from backend (use database value). If not present, keep null -> display '-'
  useEffect(() => {
    if (!user?.id) return
    let mounted = true
    ;(async () => {
      try {
        const token = await getToken()
        const res = await fetch(`${apiBase}/users/nickname?clerkId=${encodeURIComponent(user.id)}`, {
          method: "GET",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        if (res.status === 404) {
          if (mounted) setCurrentNickname(null)
          return
        }
        if (!res.ok) {
          console.warn("Failed to fetch nickname", res.status)
          return
        }
        const text = await res.text()
        if (mounted) setCurrentNickname(text || null)
      } catch (e) {
        console.error("Error fetching nickname", e)
      }
    })()
    return () => { mounted = false }
  }, [user?.id, getToken, apiBase])

  // Safely extract wallet address from various Clerk SDK / Admin shapes
  const walletDisplay = (() => {
    // SDK shapes vary between environments; prefer verified fields when available
    // @ts-ignore
    const p1 = user?.primaryWalletAddress
    // @ts-ignore
    const p2 = user?.externalAccounts?.[0]?.address
    // @ts-ignore
    const p3 = user?.web3Wallets?.[0]?.web3Wallet
    // @ts-ignore
    const p4 = user?.web3_wallets?.[0]?.web3_wallet
    return p1 || p2 || p3 || p4 || "-"
  })()

  const cancelEditNickname = () => {
    setEditingNickname(false)
  }

  const submitNickname = async () => {
    try {
      const token = await getToken()
  const res = await fetch(`${apiBase}/users/nickname?clerkId=${encodeURIComponent(user?.id || "")}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ nickname: nicknameInput }),
      })
  if (!res.ok) throw new Error(`Failed to set nickname: ${res.status}`)
  alert("Nickname updated")
  setCurrentNickname(nicknameInput || null)
  setEditingNickname(false)
  try { await user?.reload() } catch {}
    } catch (e) {
      console.error(e)
      alert("Could not update nickname")
    }
  }

  const triggerFile = () => fileInputRef.current?.click()

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      // Clerk SDK: setProfileImage is used in this project elsewhere; guard with try/catch
      // @ts-ignore
      if (user?.setProfileImage) {
        // @ts-ignore
        await user.setProfileImage({ file: f })
        try { await user.reload() } catch {}
        alert("Profile picture updated")
      } 
      else {
        alert("Profile picture was not updated, maybe try using other type of image")
      }
    } catch (err) {
      console.error(err)
      alert("Failed to upload profile picture")
    }
  }

  const doSignOut = async () => {
    try {
      await signOut()
    } catch (e) {
      console.error("Sign out failed", e)
    }
  }

  const deleteProfile = async () => {
    if (!confirm("Delete your account? This will remove your profile data from our service.")) return
    try {
      const token = await getToken()
  const res = await fetch(`${apiBase}/users?clerkId=${encodeURIComponent(user?.id || "")}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      })
      if (!res.ok && res.status !== 204) {
        console.warn("Backend delete returned", res.status)
      }

      // Attempt to delete the Clerk user if supported by the SDK
      try {
        // @ts-ignore
        if (user?.delete) await user.delete()
      } catch (e) {
        console.warn("Clerk user delete not available or failed", e)
      }

      // Finally sign out
      try { await signOut() } catch {}
    } catch (e) {
      console.error(e)
      alert("Failed to delete profile")
    }
  }

  return (
    // Don't short-circuit hooks by returning earlier; wait until hooks are registered above.
    (!isLoaded) ? null : (
    <div className="min-h-screen bg-background">
      <Header />

      {/* If Clerk loaded but no user is signed in, show a centered sign-in CTA */}
      {(!user) ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center px-4">
            <h2 className="text-2xl font-bold mb-4">Welcome to your Profile</h2>
            <h3 className="text-1xl font-bold mb-1 text-red-600">!WARNING!</h3>
            <p className="text-lg text-muted-foreground mb-4">Woopsie, seems like nobody is here yet 😘, please sign up or sign in to continue</p>
            <SignInButton mode="modal">
              <button className="px-6 py-2 border border-border rounded hover:bg-secondary transition-colors text-sm">Sign in / Sign up</button>
            </SignInButton>
          </div>
        </div>
      ) : (
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-2xl font-bold mb-8">YOUR PROFILE</h1>

        {/* User Info */}
        <div className="flex w-full items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-20 h-20 rounded-full border-2 border-border flex items-center justify-center bg-secondary overflow-hidden">
              {user?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.imageUrl} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <UserIcon className="w-10 h-10 text-muted-foreground" />
                </div>
                )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Nickname: <span className="text-foreground">{currentNickname ?? "-"}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Wallet name: <span className="text-foreground">{walletDisplay}</span>
              </p>

              {/* Buttons under profile information */}
              <div className="flex gap-2 mt-3 w-full">
                <div className="flex gap-2 w-full">
                  <button onClick={startEditNickname} className="px-3 py-1 border border-border rounded hover:bg-secondary text-sm">Edit nickname</button>
                  <button onClick={triggerFile} className="px-3 py-1 border border-border rounded hover:bg-secondary text-sm">Upload profile picture</button>
                  <button onClick={doSignOut} className="px-3 py-1 border border-border rounded hover:bg-secondary text-sm ml-auto">Sign out</button>
                </div>
              </div>
              <input ref={fileInputRef} onChange={onFileChange} type="file" accept="image/*" className="hidden" />

              {/* nickname edit area */}
              {editingNickname && (
                <div className="mt-2 flex items-center gap-2">
                  <input className="px-2 py-1 border border-border rounded" value={nicknameInput} onChange={(e) => setNicknameInput(e.target.value)} />
                  <button onClick={submitNickname} className="px-3 py-1 bg-primary text-white rounded text-sm">Save</button>
                  <button onClick={cancelEditNickname} className="px-3 py-1 border border-border rounded text-sm">Cancel</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Your Lists */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">YOUR LISTS</h2>
          </div>
          <ProductGrid products={userProducts} />
          <div className="flex justify-center mt-4">
            <button className="px-6 py-2 border border-border rounded hover:bg-secondary transition-colors text-sm">
              MORE
            </button>
          </div>
        </section>

        {/* Bought Items */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">BOUGHT ITEMS</h2>
          <ProductGrid products={userProducts} />
        </section>

        {/* Delete profile at bottom */}
        <div className="mt-12 flex justify-center">
          <button onClick={deleteProfile} className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm">Delete profile</button>
        </div>
      </main>
      )}
    </div>
    )
  )
}
