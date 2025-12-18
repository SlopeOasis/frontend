import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { ProductDetail } from "@/components/product-detail"
import type { Product } from "@/lib/types"
import { clerkClient, auth } from "@clerk/nextjs/server"

type PostWithRating = {
  post: {
    id: number
    title: string
    description?: string
    priceUSD?: number
    tags?: string[]
    previewImages?: string[]
    sellerId?: string
    azBlobName?: string
    fileVersion?: number
    copies?: number
    uploadTime?: string
    lastTimeModified?: string
  }
  ratingSummary?: {
    average: number
    count: number
  }
}

interface ProductPageProps {
  params: Promise<{ id: string }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params
  const postApiBase = process.env.NEXT_PUBLIC_POST_API_URL || "http://localhost:8081"
  const userApiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"

  let mapped: Product | null = null

  try {
    // Use public endpoint to allow browsing without authentication
    const res = await fetch(`${postApiBase}/posts/public/${id}`, { 
      cache: "no-store"
    })

    const { getToken } = await auth()
    const token = await getToken({ template: "backendVerification" })
    if (res.status === 404) return notFound()
    if (!res.ok) throw new Error(`Failed to load post (${res.status})`)

    const data: PostWithRating = await res.json()
    const post = data.post
    const ratingSummary = data.ratingSummary

    const previewNames = post.previewImages || []
    const previewUrls = await Promise.all(
      previewNames.map(async (blob) => {
        try {
          const sasRes = await fetch(`${postApiBase}/posts/${post.id}/public-sas?blobName=${encodeURIComponent(blob)}`, {
            cache: "no-store",
          })
          if (!sasRes.ok) return null
          const url = await sasRes.text()
          return url
        } catch (err) {
          console.warn("Failed to fetch preview SAS", err)
          return null
        }
      })
    )

    const images = previewUrls.filter(Boolean) as string[]
    const firstImage = images[0] || "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-4Gi5slRBIrpvjeimKEmwEAbgjBSOX1.png"

    // Fetch blob metadata (size, type, timestamps)
    let fileSizeFormatted: string | undefined
    let contentType: string | undefined
    let fileName: string | undefined
    if (post.azBlobName) {
      try {
        const metaRes = await fetch(`${postApiBase}/posts/${post.id}/blob-metadata`, {
          cache: "no-store",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        })
        if (metaRes.ok) {
          const meta = await metaRes.json() as { name: string; contentType: string; sizeBytes: number; createdAt?: string; lastModified?: string; sizeFormatted?: string }
          fileName = meta.name
          contentType = meta.contentType
          fileSizeFormatted = meta.sizeFormatted || formatBytes(meta.sizeBytes)
        }
      } catch (err) {
        console.warn("Failed to fetch blob metadata", err)
      }
    }

    mapped = {
      id: String(post.id),
      title: post.title,
      description: post.description,
      image: firstImage,
      images,
      seller: await resolveSellerDisplay(post.sellerId, userApiBase),
      rating: ratingSummary?.average ?? 0,
      ratingCount: ratingSummary?.count ?? 0,
      price: post.priceUSD ?? 0,
      priceUSD: post.priceUSD,
      category: post.tags?.[0] || "OTHER",
      tags: post.tags || [],
      fileVersion: post.fileVersion,
      copies: post.copies,
      uploadTime: post.uploadTime,
      lastTimeModified: post.lastTimeModified,
      fileSize: fileSizeFormatted,
      fileName,
      contentType,
    }
  } catch (err) {
    console.error("Failed to load product", err)
    return notFound()
  }

  if (!mapped) return notFound()

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ProductDetail product={mapped} />
    </div>
  )
}

async function resolveSellerDisplay(clerkId: string | undefined, userApiBase: string): Promise<string> {
  if (!clerkId) return "Unknown seller"

  // First try backend nickname
  try {
    const res = await fetch(`${userApiBase}/users/public/${encodeURIComponent(clerkId)}`, { cache: "no-store" })
    if (res.ok) {
      const data: { nickname?: string } = await res.json()
      if (data.nickname?.trim()) return data.nickname.trim()
    }
  } catch (err) {
    console.warn("Failed to resolve seller nickname", err)
  }

  // Fallback to wallet from Clerk (server-side) to avoid storing it
  try {
    const clerk = await clerkClient()
    const user = await clerk.users.getUser(clerkId)
    const wallet = extractWallet(user)
    if (wallet) return wallet
  } catch (err) {
    console.warn("Failed to fetch Clerk wallet for seller", err)
  }

  return clerkId
}

function extractWallet(user: any): string | null {
  // Safely extract wallet address from various Clerk SDK / Admin shapes
  // SDK shapes vary between environments; prefer verified fields when available
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

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`
}
