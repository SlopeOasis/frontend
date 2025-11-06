"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Star, UserIcon } from "lucide-react"
import type { Product } from "@/lib/types"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotateX = (y - centerY) / 10
    const rotateY = (centerX - x) / 10

    setRotation({ x: rotateX, y: rotateY })
  }

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 })
    setIsHovering(false)
  }

  return (
    <Link href={`/product/${product.id}`}>
      <div
        className="group relative"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          perspective: "1000px",
        }}
      >
        <div
          className="border border-border rounded-lg overflow-hidden bg-card transition-all duration-300 ease-out"
          style={{
            transform: isHovering
              ? `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(1.05) translateZ(20px)`
              : "rotateX(0deg) rotateY(0deg) scale(1) translateZ(0px)",
            boxShadow: isHovering ? "0 20px 40px rgba(0, 0, 0, 0.15)" : "0 1px 3px rgba(0, 0, 0, 0.1)",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Product Image */}
          <div className="aspect-square relative bg-secondary">
            <Image src={product.image || "/placeholder.svg"} alt={product.title} fill className="object-cover" />
          </div>

          {/* Product Info */}
          <div className="p-4">
            <h3 className="font-medium text-sm mb-2 line-clamp-1">{product.title}</h3>

            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
              <UserIcon className="w-3 h-3" />
              <span>{product.seller}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-medium">{product.rating}/5</span>
              </div>
              <span className="text-sm font-semibold">{product.price} USDT</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
