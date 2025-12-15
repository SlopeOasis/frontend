"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, ChevronLeft, UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Product } from "@/lib/types"

interface ProductDetailProps {
  product: Product
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const images = (product.images && product.images.length > 0 ? product.images : [product.image]).filter(Boolean)

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to products
      </Link>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square relative bg-secondary rounded-lg overflow-hidden border border-border">
            <Image
              src={images[selectedImage] || "/placeholder.svg"}
              alt={product.title}
              fill
              className="object-cover"
            />
          </div>

          {/* Thumbnail Gallery */}
          <div className="grid grid-cols-4 gap-2">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`aspect-square relative bg-secondary rounded border-2 transition-colors overflow-hidden ${
                  selectedImage === idx ? "border-foreground" : "border-border hover:border-muted-foreground"
                }`}
              >
                <Image
                  src={img || "/placeholder.svg"}
                  alt={`${product.title} ${idx + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <UserIcon className="w-4 h-4" />
              <Link href={`/profile/${product.seller}`} className="hover:text-foreground transition-colors">
                {product.seller}
              </Link>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-current text-foreground" />
                <span className="text-lg font-semibold">{product.rating.toFixed(1)}/5</span>
              </div>
              <span className="text-sm text-muted-foreground">({product.ratingCount ?? 0} ratings)</span>
            </div>

            <div className="text-3xl font-bold mb-6">{product.priceUSD ?? product.price} USDT</div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button size="lg" className="flex-1">
              Buy Now
            </Button>
          </div>

          {/* Product Details Tabs */}
          <Tabs defaultValue="description" className="mt-8">
            <TabsList className="w-full">
              <TabsTrigger value="description" className="flex-1">
                Description
              </TabsTrigger>
              <TabsTrigger value="details" className="flex-1">
                Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6 space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                {product.description ||
                  "no description provided for this product."}
              </p>
            </TabsContent>

            <TabsContent value="details" className="mt-6">
              <dl className="space-y-3">
                {product.fileVersion !== undefined && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <dt className="text-muted-foreground">Version</dt>
                    <dd className="font-medium text-right">{product.fileVersion}</dd>
                  </div>
                )}
                {product.tags && product.tags.length > 0 && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <dt className="text-muted-foreground">Categories</dt>
                    <dd className="font-medium text-right">{product.tags.join(", ")}</dd>
                  </div>
                )}
                {product.fileSize && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <dt className="text-muted-foreground">Size</dt>
                    <dd className="font-medium text-right">{product.fileSize}</dd>
                  </div>
                )}
                {product.fileName && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <dt className="text-muted-foreground">File</dt>
                    <dd className="font-medium text-right break-words">{product.fileName}</dd>
                  </div>
                )}
                {product.contentType && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <dt className="text-muted-foreground">Type</dt>
                    <dd className="font-medium text-right">{product.contentType}</dd>
                  </div>
                )}
                {product.copies !== undefined && product.copies !== -1 && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <dt className="text-muted-foreground">Left in stock</dt>
                    <dd className="font-medium text-right">{product.copies}</dd>
                  </div>
                )}
                {product.uploadTime && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <dt className="text-muted-foreground">Upload time</dt>
                    <dd className="font-medium text-right">{product.uploadTime}</dd>
                  </div>
                )}
                {product.lastTimeModified && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <dt className="text-muted-foreground">Last modified</dt>
                    <dd className="font-medium text-right">{product.lastTimeModified}</dd>
                  </div>
                )}
              </dl>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  )
}
