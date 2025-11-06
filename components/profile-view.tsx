"use client"

import { useState } from "react"
import { Star, MapPin, Calendar, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductGrid } from "@/components/product-grid"
import type { Product } from "@/lib/types"

interface ProfileViewProps {
  username: string
  products: Product[]
}

export function ProfileView({ username, products }: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState("listings")

  // Mock user stats
  const stats = {
    rating: 4.8,
    totalReviews: 127,
    totalSales: 342,
    memberSince: "January 2024",
    location: "United States",
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-card border border-border rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center text-3xl font-bold">
            {username.charAt(0).toUpperCase()}
          </div>

          {/* User Info */}
          <div className="flex-1 space-y-3">
            <div>
              <h1 className="text-2xl font-bold mb-1">{username}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{stats.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Member since {stats.memberSince}</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-current" />
                <span className="font-semibold">{stats.rating}/5</span>
                <span className="text-sm text-muted-foreground">({stats.totalReviews} reviews)</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                <span className="font-semibold">{stats.totalSales}</span>
                <span className="text-sm text-muted-foreground">sales</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" className="flex-1 md:flex-none bg-transparent">
              Follow
            </Button>
            <Button className="flex-1 md:flex-none">Contact</Button>
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="listings">Listings ({products.length})</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({stats.totalReviews})</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="mt-6">
          {products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No listings yet</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((review) => (
              <div key={review} className="bg-card border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-medium">
                      U{review}
                    </div>
                    <span className="font-medium">Buyer {review}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-medium">{stats.rating}/5</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Excellent seller! Fast shipping, great communication, and product exactly as described. Highly
                  recommend!
                </p>
                <p className="text-xs text-muted-foreground">2 weeks ago</p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="about" className="mt-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">About {username}</h3>
              <p className="text-muted-foreground leading-relaxed">
                Passionate seller dedicated to providing quality products and excellent customer service. I specialize
                in curating unique items and ensuring every transaction is smooth and satisfying.
              </p>
            </div>

            <div className="pt-4 border-t border-border">
              <h3 className="font-semibold mb-3">Seller Stats</h3>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Response time</dt>
                  <dd className="font-medium">Within 2 hours</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Shipping time</dt>
                  <dd className="font-medium">1-3 business days</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Return policy</dt>
                  <dd className="font-medium">30-day returns</dd>
                </div>
              </dl>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
}
