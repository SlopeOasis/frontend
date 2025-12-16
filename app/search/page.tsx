import { Header } from "@/components/header"
import { ProductGrid } from "@/components/product-grid"
import type { Product } from "@/lib/types"

const SLOPE_LOGO = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-4Gi5slRBIrpvjeimKEmwEAbgjBSOX1.png"

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams
  const query = q || ""
  
  const postApiBase = process.env.NEXT_PUBLIC_POST_API_URL || "http://localhost:8081"
  const userApiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"

  const products = await searchProducts(query, postApiBase, userApiBase)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Search Results</h1>
        <p className="text-muted-foreground mb-6">
          {query ? `Found ${products.length} results for "${query}"` : "Enter a search query"}
        </p>
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No results found. Try a different search term.
          </div>
        )}
      </main>
    </div>
  )
}

async function searchProducts(query: string, postApiBase: string, userApiBase: string): Promise<Product[]> {
  if (!query.trim()) return []

  try {
    const res = await fetch(
      `${postApiBase}/posts/search/title?q=${encodeURIComponent(query)}&page=0&size=50`,
      { cache: "no-store" }
    )
    if (!res.ok) return []

    const posts: Array<{
      id: number
      title: string
      description: string
      priceUSD?: number
      tags?: string[]
      previewImages?: string[]
      sellerId: string
    }> = await res.json()

    return await Promise.all(
      posts.map(async (post) => {
        // Resolve seller display name
        const sellerLabel = await resolveSellerDisplay(post.sellerId, userApiBase)

        // Get preview image SAS URL
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
  try {
    const res = await fetch(`${userApiBase}/users/public/${encodeURIComponent(clerkId)}`, { cache: "no-store" })
    if (res.ok) {
      const data: { nickname?: string } = await res.json()
      if (data.nickname?.trim()) return data.nickname.trim()
    }
  } catch {}
  return clerkId.slice(0, 8)
}
