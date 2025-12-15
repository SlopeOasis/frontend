import { Header } from "@/components/header"
import { ProductGrid } from "@/components/product-grid"
import type { Product } from "@/lib/types"
import { notFound } from "next/navigation"
import { clerkClient } from "@clerk/nextjs/server"

const VALID_TAGS = ["ART", "MUSIC", "VIDEO", "CODE", "TEMPLATE", "PHOTO", "MODEL_3D", "FONT", "OTHER"]
const SLOPE_LOGO = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-4Gi5slRBIrpvjeimKEmwEAbgjBSOX1.png"

type PostResponse = {
  id: number
  title: string
  description: string
  priceUSD?: number
  tags?: string[]
  previewImages?: string[]
  sellerId?: string
}

type PublicUserResponse = {
  nickname?: string
}

export default async function ShowcasePage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params
  const tagUpper = tag.toUpperCase()

  // Validate tag
  if (!VALID_TAGS.includes(tagUpper)) {
    notFound()
  }

  let products: Product[] = []
  let error: string | null = null
  const userApiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"

  try {
    const postApiBase = process.env.NEXT_PUBLIC_POST_API_URL || "http://localhost:8081"
    const res = await fetch(`${postApiBase}/posts/tag/${tagUpper}`, { cache: "no-store" })

    if (!res.ok) {
      throw new Error(`Failed to fetch posts (${res.status})`)
    }

    const posts: PostResponse[] = await res.json()

    const sellerCache = new Map<string, Promise<string>>()

    products = await Promise.all(posts.map(async (post) => {
      let imageUrl = SLOPE_LOGO
      if (post.previewImages?.[0]) {
        try {
          const sasRes = await fetch(
            `${process.env.NEXT_PUBLIC_POST_API_URL || "http://localhost:8081"}/posts/${post.id}/public-sas?blobName=${encodeURIComponent(post.previewImages[0])}`,
            { cache: "no-store" }
          )
          if (sasRes.ok) {
            imageUrl = await sasRes.text()
          }
        } catch (err) {
          console.warn("Failed to fetch SAS URL", err)
        }
      }
      const sellerDisplay = await resolveSellerDisplay(post.sellerId, userApiBase, sellerCache)

      return {
        id: String(post.id),
        title: post.title,
        image: imageUrl,
        seller: sellerDisplay,
        rating: 0,
        price: post.priceUSD ?? 0,
        category: tagUpper,
        description: post.description,
        tags: post.tags || [],
      }
    }))
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load products"
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Tag Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{tagUpper}</h1>
          <p className="text-muted-foreground">Browse all items tagged with {tagUpper}</p>
        </div>

        {/* Products Section */}
        {error ? (
          <div className="text-center py-12 text-red-600">{error}</div>
        ) : products.length > 0 ? (
          <section>
            <ProductGrid products={products} />
          </section>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No items found for this tag.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-6">
        <div className="container mx-auto px-4 flex justify-between items-center text-sm text-muted-foreground">
          <span>©SlopeOasis</span>
          <button className="hover:text-foreground transition-colors">About SlopeOasis</button>
        </div>
      </footer>
    </div>
  )
}

async function resolveSellerDisplay(
  clerkId: string | undefined,
  userApiBase: string,
  cache: Map<string, Promise<string>>
): Promise<string> {
  if (!clerkId) return "Unknown seller"

  const cached = cache.get(clerkId)
  if (cached) return cached

  const fetchPromise = (async () => {
    try {
      const res = await fetch(`${userApiBase}/users/public/${encodeURIComponent(clerkId)}`, { cache: "no-store" })
      if (res.ok) {
        const data: PublicUserResponse = await res.json()
        if (data.nickname?.trim()) return data.nickname.trim()
      }
    } catch (err) {
      console.warn("Failed to resolve seller nickname", err)
    }

    // Fallback to Clerk wallet without storing it
    try {
      const clerk = await clerkClient()
      const user = await clerk.users.getUser(clerkId)
      const wallet = extractWallet(user)
      if (wallet) return wallet
    } catch (err) {
      console.warn("Failed to fetch Clerk wallet for seller", err)
    }

    return clerkId
  })()

  cache.set(clerkId, fetchPromise)
  return fetchPromise
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
