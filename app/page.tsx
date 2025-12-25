import { Header } from "@/components/header"
import { ProductGrid } from "@/components/product-grid"
import type { Product } from "@/lib/types"
import { auth } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/nextjs/server"

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

const userApiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"
const sellerCache = new Map<string, Promise<string>>()

export default async function HomePage() {
  let themedProducts: Product[] = []
  let error: string | null = null

  try{
    const postApiBase = process.env.NEXT_PUBLIC_POST_API_URL || "http://localhost:8081"
    const { getToken } = await auth()
    const token = await getToken({ template: "backendVerification" })

    
    const res = await fetch(`${postApiBase}/posts/themes`, { 
      cache: "no-store",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    })

    if (!res.ok) {
      throw new Error(`Failed to fetch themed posts (${res.status})`)
    }

    const posts: PostResponse[] = await res.json()

    // Deduplicate posts by ID (posts may appear multiple times if they match multiple themes)
    const uniquePosts = Array.from(
      new Map(posts.map(post => [post.id, post])).values()
    )

    themedProducts = await Promise.all(uniquePosts.map(async (post) => {
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
          console.warn("Failed to fetch SAS URL for themed posts", err)
        }
      }
      return {
        id: String(post.id),
        title: post.title,
        image: imageUrl,
        seller: await resolveSellerDisplay(post.sellerId, userApiBase, sellerCache) || "Unknown",
        price: post.priceUSD ?? 0,
        priceUSD: post.priceUSD ?? 0,
        rating: 0,
        category: "",
        tags: post.tags || [],
        description: post.description,
      }
    }))
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load products"
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Products Section */}
        {error? (
          <div className="flex justify-center text-red-500">{error}. Try logging in, to see suggested products.</div>
        ) : themedProducts.length > 0 ? (
          <section>
            <ProductGrid products={themedProducts} />
          </section>
        ) : (
          <div className="flex justify-center text-green-500">No listings matched your interests. Edit or add them in your profile.</div>
        )}

        {/* Load More Button */}
        <div className="flex justify-center mt-8">
          <button className="px-8 py-2 border border-border rounded hover:bg-secondary transition-colors">
            Load more
          </button>
        </div>
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



//dodan da se bo uporablu epic username al pa wallet ne clerkid
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