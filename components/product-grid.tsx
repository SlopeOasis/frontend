import { ProductCard } from "./product-card"
import type { Product } from "@/lib/types"

interface ProductGridProps {
  products: Product[]
  editHrefBuilder?: (product: Product) => string
  previewHrefBuilder?: (product: Product) => string
  showOverlay?: boolean
}

export function ProductGrid({ products, editHrefBuilder, previewHrefBuilder, showOverlay = false }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product, i) => (
        <ProductCard
          key={product.id}
          product={product}
          index={i}
          editHref={editHrefBuilder?.(product)}
          previewHref={previewHrefBuilder?.(product)}
          showOverlay={showOverlay}
        />
      ))}
    </div>
  )
}
