"use client"

import { Header } from "@/components/header"
import { ProductGrid } from "@/components/product-grid"
import { User as UserIcon, Plus, Check } from "lucide-react"
import React, { useRef, useState, useEffect, useCallback } from "react"
import { useUser, useAuth, SignInButton } from "@clerk/nextjs"
import type { Product } from "@/lib/types"

const INTERESTS = ["ART", "MUSIC", "VIDEO", "CODE", "TEMPLATE", "PHOTO", "MODEL_3D", "FONT", "OTHER"]
const SLOPE_LOGO = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-4Gi5slRBIrpvjeimKEmwEAbgjBSOX1.png"

export default function ProfilePage() {
  const { user, isLoaded } = useUser()
  const { getToken, signOut } = useAuth()

  const [editingNickname, setEditingNickname] = useState(false)
  const [nicknameInput, setNicknameInput] = useState("")
  const [currentNickname, setCurrentNickname] = useState<string | null>(null)
  const [editingInterests, setEditingInterests] = useState(false)
  const [currentInterests, setCurrentInterests] = useState<(string | null)[]>([null, null, null])
  const [tempInterests, setTempInterests] = useState<(string | null)[]>([null, null, null])
  const [myListings, setMyListings] = useState<Product[]>([])
  const [loadingListings, setLoadingListings] = useState(false)
  const [listingsError, setListingsError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"
  const postApiBase = process.env.NEXT_PUBLIC_POST_API_URL || "http://localhost:8081"

  type PostResponse = {
    id: number | string
    title: string
    description: string
    priceUSD?: number
    tags?: string[]
    previewImages?: string[]
    azBlobName?: string
  }

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
        const token = await getToken({ template: "backendVerification" })
        if (!token) return
        const res = await fetch(`${apiBase}/users/nickname`, {
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

  // Fetch interests from backend
  useEffect(() => {
    if (!user?.id) return
    let mounted = true
    ;(async () => {
      try {
        const token = await getToken({ template: "backendVerification" })
        if (!token) return
        const res = await fetch(`${apiBase}/users/themes`, {
          method: "GET",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        if (res.status === 404 || !res.ok) {
          if (mounted) setCurrentInterests([null, null, null])
          return
        }
        const themes = await res.json()
        if (mounted) setCurrentInterests(themes || [null, null, null])
      } catch (e) {
        console.error("Error fetching interests", e)
      }
    })()
    return () => { mounted = false }
  }, [user?.id, getToken, apiBase])

    // Best-effort preview SAS fetch for the first preview image of a post
    const fetchPreviewUrl = useCallback(async (post: PostResponse, token: string | null) => {
      const blobName = post.previewImages?.[0]
      if (!blobName || !token) return null
      try {
        const sasRes = await fetch(`${postApiBase}/posts/${post.id}/blob-sas?blobName=${encodeURIComponent(blobName)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!sasRes.ok) return null
        const sas = await sasRes.text()
        return sas.replace(/^"|"$/g, "")
      } catch (err) {
        console.warn("Failed to fetch preview SAS", err)
        return null
      }
    }, [postApiBase])

    // Load current user's listings from post-service
    useEffect(() => {
      if (!user?.id) return
      let mounted = true
      setLoadingListings(true)
      setListingsError(null)
      ;(async () => {
        try {
          const token = await getToken({ template: "backendVerification" })
          const res = await fetch(`${postApiBase}/posts/seller/${user.id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          })
          if (res.status === 401) {
            if (mounted) setListingsError("Unauthorized. Please sign in again.")
            return
          }
          if (!res.ok) throw new Error(`Failed to load listings (${res.status})`)
          const posts: PostResponse[] = await res.json()
          const sellerLabel = currentNickname || user.username || user.fullName || "You"

          const products = await Promise.all(posts.map(async (post) => {
            const previewUrl = await fetchPreviewUrl(post, token)
            return {
              id: String(post.id),
              title: post.title,
              image: previewUrl || SLOPE_LOGO,
              seller: sellerLabel,
              rating: 0,
              price: post.priceUSD ?? 0,
              category: post.tags?.[0] || "OTHER",
              description: post.description,
              tags: post.tags || [],
            } satisfies Product
          }))

          if (mounted) setMyListings(products)
        } catch (e) {
          if (mounted) setListingsError(e instanceof Error ? e.message : "Failed to load listings")
        } finally {
          if (mounted) setLoadingListings(false)
        }
      })()
      return () => { mounted = false }
    }, [user?.id, user?.username, user?.fullName, getToken, postApiBase, currentNickname, fetchPreviewUrl])

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

  const startEditInterests = () => {
    setTempInterests([...currentInterests])
    setEditingInterests(true)
  }

  const cancelEditInterests = () => {
    setEditingInterests(false)
  }

  const submitInterests = async () => {
    try {
      const token = await getToken({ template: "backendVerification" })
      if (!token) return
      const res = await fetch(`${apiBase}/users/themes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(tempInterests),
      })
      if (!res.ok) throw new Error(`Failed to set interests: ${res.status}`)
      alert("Interests updated")
      setCurrentInterests(tempInterests)
      setEditingInterests(false)
      try { await user?.reload() } catch {}
    } catch (e) {
      console.error(e)
      alert("Could not update interests")
    }
  }

  const submitNickname = async () => {
    try {
        const token = await getToken({ template: "backendVerification" })
        if (!token) return
      const res = await fetch(`${apiBase}/users/nickname`, {
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
        const token = await getToken({ template: "backendVerification" })
        if (!token) return
      const res = await fetch(`${apiBase}/users`, {
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
              <p className="text-sm text-muted-foreground">
                Interests: <span className="text-foreground">{currentInterests.filter(i => i).join(", ") || "-"}</span>
              </p>

              {/* Buttons under profile information */}
              <div className="flex gap-2 mt-3 w-full">
                <div className="flex gap-2 w-full flex-wrap">
                  <button onClick={startEditNickname} className="px-3 py-1 border border-border rounded hover:bg-secondary text-sm">Edit nickname</button>
                  <button onClick={startEditInterests} className="px-3 py-1 border border-border rounded hover:bg-secondary text-sm">Edit interests</button>
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

              {/* interests edit area */}
              {editingInterests && (
                <div className="mt-4 border border-border rounded p-4">
                  <h3 className="text-sm font-semibold mb-3">Select your interests (up to 3)</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
                    {INTERESTS.map((interest) => {
                      const isSelected = tempInterests.includes(interest)
                      return (
                        <button
                          key={interest}
                          onClick={() => {
                            if (isSelected) {
                              // Remove if already selected - replace with null instead of filtering
                              const newInterests = tempInterests.map(i => i === interest ? null : i)
                              setTempInterests(newInterests)
                            } else if (tempInterests.filter(i => i !== null).length < 3) {
                              // Add if under 3 selections
                              const idx = tempInterests.findIndex(i => i === null)
                              if (idx !== -1) {
                                const newInterests = [...tempInterests]
                                newInterests[idx] = interest
                                setTempInterests(newInterests)
                              }
                            }
                          }}
                          className={`px-3 py-1 rounded border text-sm transition-colors flex items-center justify-center gap-1 ${
                            isSelected
                              ? "bg-blue-500 text-white border-blue-600 hover:bg-blue-600"
                              : "border-border hover:bg-secondary"
                          }`}
                        >
                          {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                          <span>{interest}</span>
                        </button>
                      )
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">
                    Selected: {tempInterests.filter(i => i !== null).length} / 3
                  </div>
                  <div className="flex gap-2">
                    <button onClick={submitInterests} className="px-3 py-1 bg-primary text-white rounded text-sm">Save</button>
                    <button onClick={cancelEditInterests} className="px-3 py-1 border border-border rounded text-sm">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* New Listing Button */}
        <a href="/upload" className="z-50 fixed bottom-20 right-20 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors text-sm"> + NEW LISTING</a>
        {/* Your Lists */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="m-auto text-lg font-semibold">YOUR LISTS</h2>
          </div>
          {loadingListings ? (
            <div className="text-center py-12 text-muted-foreground">Loading your listings...</div>
          ) : listingsError ? (
            <div className="text-center py-12 text-red-600">{listingsError}</div>
          ) : myListings.length > 0 ? (
            <ProductGrid
              products={myListings}
              showOverlay
              editHrefBuilder={(p) => `/edit/${p.id}`}
              previewHrefBuilder={(p) => `/product/${p.id}`}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No listings yet. Create your first listing!</p>
            </div>
          )}
        </section>

        {/* Bought Items */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="m-auto text-lg font-semibold mb-4">BOUGHT ITEMS</h2>
          </div>
          <div className="text-center py-12 text-muted-foreground">
            <p>No purchases yet.</p>
          </div>
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
