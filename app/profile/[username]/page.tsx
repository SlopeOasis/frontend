import { Header } from "@/components/header"
import { ProfileView } from "@/components/profile-view"
import type { Product } from "@/lib/types"
import { clerkClient } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"

const SLOPE_LOGO = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-4Gi5slRBIrpvjeimKEmwEAbgjBSOX1.png"

interface ProfilePageProps {
  params: Promise<{
    username: string // nickname or wallet address or Clerk ID
  }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username: candidate } = await params
  const postApiBase = process.env.NEXT_PUBLIC_POST_API_URL || "http://localhost:8081"
  const userApiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"

  const resolvedClerkId = await resolveClerkId(candidate, userApiBase)
  if (!resolvedClerkId) return notFound()

  const sellerLabel = await resolveSellerDisplay(resolvedClerkId, userApiBase)
  const products = await loadSellerProducts(resolvedClerkId, sellerLabel, postApiBase)

  // Fetch Clerk join date for "Member since"
  let memberSince: string | undefined
  let imageUrl: string | undefined
  try {
    const clerk = await clerkClient()
    const user = await clerk.users.getUser(resolvedClerkId)
    const createdAt = (user as any)?.createdAt || (user as any)?.created_at
    if (createdAt) {
      const d = new Date(createdAt)
      memberSince = d.toLocaleString(undefined, { month: "long", year: "numeric" })
    }
    imageUrl = (user as any)?.imageUrl || (user as any)?.image_url
  } catch {}

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ProfileView username={sellerLabel} products={products} memberSince={memberSince} imageUrl={imageUrl} />
    </div>
  )
}

async function resolveClerkId(candidate: string, userApiBase: string): Promise<string | null> {
  // If candidate is a Clerk ID, our public endpoint will succeed
  try {
    const res = await fetch(`${userApiBase}/users/public/${encodeURIComponent(candidate)}`, { cache: "no-store" })
    if (res.ok) return candidate
  } catch {}

  // Try resolving via user-service nickname mapping first
  try {
    const res = await fetch(`${userApiBase}/users/public/by-nickname/${encodeURIComponent(candidate)}`, { cache: "no-store" })
    if (res.ok) {
      const clerkId = await res.text()
      if (clerkId) return clerkId.replace(/^"|"$/g, "")
    }
  } catch {}

  const clerk = await clerkClient()

  // Try resolving by exact username
  try {
    const byUsername = await clerk.users.getUserList({ username: [candidate], limit: 1 })
    const matchUsername = byUsername?.data?.[0]
    if (matchUsername?.id) return matchUsername.id
  } catch {}

  // Try email
  try {
    const byEmail = await clerk.users.getUserList({ emailAddress: [candidate], limit: 1 })
    const matchEmail = byEmail?.data?.[0]
    if (matchEmail?.id) return matchEmail.id
  } catch {}

  // As last resort generic query
  try {
    const list = await clerk.users.getUserList({ query: candidate, limit: 1 })
    const match = list?.data?.[0]
    if (match?.id) return match.id
  } catch {}

  // If candidate is a wallet address, you may need a mapping in Clerk custom attributes; unsupported here
  return null
}

async function loadSellerProducts(sellerId: string, sellerLabel: string, postApiBase: string): Promise<Product[]> {
  try {
    const res = await fetch(`${postApiBase}/posts/seller/${encodeURIComponent(sellerId)}`, { cache: "no-store" })
    if (!res.ok) return []
    const posts: Array<{
      id: number
      title: string
      description: string
      priceUSD?: number
      tags?: string[]
      previewImages?: string[]
    }> = await res.json()

    return await Promise.all(
      posts.map(async (post) => {
        let imageUrl = SLOPE_LOGO
        const blob = post.previewImages?.[0]
        if (blob) {
          try {
            const sasRes = await fetch(
              `${postApiBase}/posts/${post.id}/public-sas?blobName=${encodeURIComponent(blob)}`,
              { cache: "no-store" }
            )
            if (sasRes.ok) {
              imageUrl = await sasRes.text()
            }
          } catch {}
        }

        return {
          id: String(post.id),
          title: post.title,
          image: imageUrl,
          seller: sellerLabel,
          rating: 0,
          price: post.priceUSD ?? 0,
          category: post.tags?.[0] || "OTHER",
          description: post.description,
          tags: post.tags || [],
        }
      })
    )
  } catch {
    return []
  }
}

async function resolveSellerDisplay(clerkId: string, userApiBase: string): Promise<string> {
  // Prefer backend nickname
  try {
    const res = await fetch(`${userApiBase}/users/public/${encodeURIComponent(clerkId)}`, { cache: "no-store" })
    if (res.ok) {
      const data: { nickname?: string } = await res.json()
      if (data.nickname?.trim()) return data.nickname.trim()
    }
  } catch {}

  // Fallback to wallet via Clerk
  try {
    const clerk = await clerkClient()
    const user = await clerk.users.getUser(clerkId)
    const wallet = extractWallet(user)
    if (wallet) return wallet
  } catch {}

  return "Unknown seller"
}

function extractWallet(user: any): string | null {
  // Safely extract wallet address from various Clerk SDK / Admin shapes
  // @ts-ignore
  const p1 = user?.primaryWalletAddress
  // @ts-ignore
  const p2 = user?.externalAccounts?.[0]?.address
  // @ts-ignore
  const p3 = user?.web3Wallets?.[0]?.web3Wallet
  // @ts-ignore
  const p4 = user?.web3_wallets?.[0]?.web3_wallet
  return p1 || p2 || p3 || p4 || null
}
