import { Header } from "@/components/header"
import { ProductGrid } from "@/components/product-grid"
import { mockProducts } from "@/lib/mock-data"

export default function HomePage() {
  const featuredProducts = mockProducts.slice(0, 4)
  const allProducts = mockProducts

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Featured Section */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">FEATURED</h2>
          <ProductGrid products={featuredProducts} />
        </section>

        {/* Products Section */}
        <section>
          <h2 className="text-xl font-semibold mb-6">PRODUCTS</h2>
          <ProductGrid products={allProducts} />
        </section>

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
