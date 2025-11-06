import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { ProductDetail } from "@/components/product-detail"
import { mockProducts } from "@/lib/mock-data"

interface ProductPageProps {
  params: {
    id: string
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  const product = mockProducts.find((p) => p.id === params.id)

  if (!product) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ProductDetail product={product} />
    </div>
  )
}
