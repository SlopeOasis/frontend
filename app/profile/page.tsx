import { Header } from "@/components/header"
import { ProductGrid } from "@/components/product-grid"
import { mockProducts } from "@/lib/mock-data"
import { User } from "lucide-react"

export default function ProfilePage() {
  const userProducts = mockProducts.slice(0, 4)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-2xl font-bold mb-8">PROFILE</h1>

        {/* User Info */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-full border-2 border-border flex items-center justify-center bg-secondary">
            <User className="w-10 h-10 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Alias: <span className="text-foreground">Jangz Krajaski</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Wallet name: <span className="text-foreground">XXXXXXXXXXXXXXX</span>
            </p>
          </div>
        </div>

        {/* Important Notifications */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">IMPORTANT NOTIFICATIONS</h2>
          <div className="border border-border rounded-lg p-4 bg-card">
            <p className="text-sm text-muted-foreground mb-2">Date: 12.12.1212,</p>
            <p className="text-sm leading-relaxed">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. In fringilla justo a odio maximus sollicitudin.
              Vivamus hendrerit pibus mi metus at nunc. Maecenas interdum augue ac purus imperdiet hendrerit.
              Suspendisse.
            </p>
          </div>
        </section>

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

        {/* Plans */}
        <section>
          <h2 className="text-lg font-semibold mb-4">PLANS</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-border rounded-lg p-4 bg-card">
              <h3 className="font-semibold mb-2">Bonus places: #</h3>
              <p className="text-sm text-muted-foreground mb-1">Bonus space: #</p>
              <p className="text-sm text-muted-foreground mb-1">Bonus space expire date: 12.12.1212</p>
              <p className="text-sm text-muted-foreground mb-1">Bonus analytics expire date: 12.12.1212</p>
              <p className="text-sm text-muted-foreground">Fiver account expire date: 12.12.1212</p>
            </div>
            <div className="border border-border rounded-lg p-4 bg-card">
              <h3 className="font-semibold mb-2">Current places taken: #</h3>
              <p className="text-sm text-muted-foreground mb-1">Current space taken: #</p>
              <p className="text-sm text-muted-foreground mb-1">Lockup date: 12.12.1212</p>
              <p className="text-sm text-muted-foreground mb-1">Lockup date: 12.12.1212</p>
              <p className="text-sm text-muted-foreground">Lockup date: 12.12.1212</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
