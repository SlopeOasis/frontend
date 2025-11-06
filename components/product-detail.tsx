"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, UserIcon, ChevronLeft, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Product } from "@/lib/types"

interface ProductDetailProps {
  product: Product
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const images = [product.image, product.image, product.image] // Mock multiple images

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
                <span className="text-lg font-semibold">{product.rating}/5</span>
              </div>
              <span className="text-sm text-muted-foreground">(24 reviews)</span>
            </div>

            <div className="text-3xl font-bold mb-6">{product.price} USDT</div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button size="lg" className="flex-1">
              Buy Now
            </Button>
            <Button size="lg" variant="outline" className="flex-1 bg-transparent">
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact Seller
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
              <TabsTrigger value="reviews" className="flex-1">
                Reviews
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6 space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                {product.description ||
                  "This is a premium quality product perfect for your needs. Carefully crafted with attention to detail and built to last. Whether you're a beginner or an expert, this item will exceed your expectations."}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Features include high-quality materials, excellent craftsmanship, and a design that combines
                functionality with style. Perfect for everyday use or special occasions.
              </p>
            </TabsContent>

            <TabsContent value="details" className="mt-6">
              <dl className="space-y-3">
                <div className="flex justify-between py-2 border-b border-border">
                  <dt className="text-muted-foreground">Condition</dt>
                  <dd className="font-medium">New</dd>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <dt className="text-muted-foreground">Category</dt>
                  <dd className="font-medium">{product.category}</dd>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <dt className="text-muted-foreground">Location</dt>
                  <dd className="font-medium">United States</dd>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <dt className="text-muted-foreground">Shipping</dt>
                  <dd className="font-medium">Free shipping available</dd>
                </div>
              </dl>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6 space-y-4">
              {[1, 2, 3].map((review) => (
                <div key={review} className="border border-border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <span className="font-medium">User {review}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-medium">{product.rating}/5</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Great product! Exactly as described and arrived quickly. Would definitely recommend to others.
                  </p>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  )
}
