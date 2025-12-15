import { Header } from "@/components/header"
import { ProductGrid } from "@/components/product-grid"
import type { Product } from "@/lib/types"

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

export default async function HomePage() {
  let themedProducts: Product[] = []
  let error: string | null = null

  try{
    const postApiBase = process.env.NEXT_PUBLIC_POST_API_URL || "http://localhost:8081"
    const res = await fetch(`${postApiBase}/posts/themes`, { cache: "no-store" }  )

    if (!res.ok) {
      throw new Error(`Failed to fetch themed posts (${res.status})`)
    }

    const posts: PostResponse[] = await res.json()

    themedProducts = await Promise.all(posts.map(async (post) => {
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
        seller: post.sellerId || "Unknown",
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
          <div className="text-red-500">{error}</div>
        ) : themedProducts.length > 0 ? (
          <section>
            <ProductGrid products={themedProducts} />
          </section>
        ) : (
          <div>No products available.</div>
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
