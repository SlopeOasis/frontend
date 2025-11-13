"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Plus, MoreVertical, Edit, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { mockProducts } from "@/lib/mock-data"

export function ManageListings() {
  const [activeTab, setActiveTab] = useState("active")

  // Mock user's listings
  const userListings = mockProducts.slice(0, 6)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">My Listings</h1>
          <p className="text-muted-foreground">Manage your products and sales</p>
        </div>
        <Link href="/upload">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Listing
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active ({userListings.length})</TabsTrigger>
          <TabsTrigger value="drafts">Drafts (0)</TabsTrigger>
          <TabsTrigger value="sold">Sold (12)</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <div className="grid gap-4">
            {userListings.map((product) => (
              <div key={product.id} className="bg-card border border-border rounded-lg p-4 flex gap-4">
                {/* Product Image */}
                <div className="w-24 h-24 relative bg-secondary rounded overflow-hidden shrink-0">
                  <Image src={product.image || "/placeholder.svg"} alt={product.title} fill className="object-cover" />
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-1 truncate">{product.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">Category: {product.category}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-semibold">{product.price} USDT</span>
                    <span className="text-muted-foreground">24 views</span>
                    <span className="text-muted-foreground">3 favorites</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-start gap-2">
                  <Link href={`/product/${product.id}`}>
                    <Button variant="outline" size="sm" className="bg-transparent">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </Link>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="drafts" className="mt-6">
          <div className="text-center py-12 text-muted-foreground">
            <p>No draft listings</p>
          </div>
        </TabsContent>

        <TabsContent value="sold" className="mt-6">
          <div className="text-center py-12 text-muted-foreground">
            <p>Your sold items will appear here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
