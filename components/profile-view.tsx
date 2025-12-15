"use client"

import { Calendar, Package } from "lucide-react"
import { ProductGrid } from "@/components/product-grid"
import type { Product } from "@/lib/types"

interface ProfileViewProps {
  username: string
  products: Product[]
  memberSince?: string
  imageUrl?: string
}

export function ProfileView({ username, products, memberSince, imageUrl }: ProfileViewProps) {
  const stats = {
    memberSince: memberSince || "",
    location: "",
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-card border border-border rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          {/* Avatar (from Clerk) */}
          <div className="w-24 h-24 rounded-full bg-secondary overflow-hidden border border-border">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold">
                {username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 space-y-3">
            <div>
              <h1 className="text-2xl font-bold mb-1">{username}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {/* Location removed */}
                {stats.memberSince && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Member since {stats.memberSince}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Minimal stats removed (ratings, reviews, sales) */}
            <div className="flex items-center gap-6"></div>
          </div>
          {/* Action Buttons removed */}
        </div>
      </div>

      {/* Listings only (tabs removed) */}
      <div className="mt-6">
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No listings yet</p>
          </div>
        )}
      </div>
    </main>
  )
}
