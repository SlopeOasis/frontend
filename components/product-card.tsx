"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Star, UserIcon, Pencil, Eye } from "lucide-react"
import type { Product } from "@/lib/types"

interface ProductCardProps {
  product: Product
  index?: number
  editHref?: string
  previewHref?: string
  showOverlay?: boolean
}

export function ProductCard({ product, index = 0, editHref, previewHref, showOverlay = false }: ProductCardProps) {
  const [isHovering, setIsHovering] = useState(false)
  const fallbackImage = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-4Gi5slRBIrpvjeimKEmwEAbgjBSOX1.png"
  const imageSrc = product.image || fallbackImage

  const handleMouseLeave = (): void => {
    setIsHovering(false)
  }

  const cardInner = (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={handleMouseLeave}
    >
        <div
          className="border border-border rounded-lg overflow-hidden bg-card"
          style={{
            transformStyle: "preserve-3d",
            // Hover pop
            transition: "transform 220ms cubic-bezier(.2,.9,.2,1), box-shadow 180ms ease",
            willChange: "transform, box-shadow",
            boxShadow: isHovering ? "0 6px 18px rgba(0, 0, 0, 0.18)" : "0 6px 18px rgba(0,0,0,0.06)",
            transform: (() => {
              const translateY = isHovering ? 6 : 0
              const translateX = isHovering ? 6 : 0
              return `translateY(${translateY}px) translateX(${translateX}px)`
            })(),
          }}
        >
          {/* Product Image */}
          <div className="aspect-square relative bg-secondary">
            <Image src={imageSrc} alt={product.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover" />

            {showOverlay && (
              <div className="absolute inset-0 flex opacity-0 group-hover:opacity-100 transition-opacity bg-black/45">
                <div className="absolute left-1/2 top-1/5 h-3/5 w-px bg-gray-300/70" />
                <Link
                  href={editHref || "#"}
                  className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-200 hover:text-white transition-transform duration-150 ease-out hover:scale-120"
                >
                  <Pencil className="w-6 h-6 transition-transform duration-150 ease-out group-hover:scale-105" />
                  <span className="text-sm font-medium transition-transform duration-150 ease-out group-hover:scale-105">Edit</span>
                </Link>
                <Link
                  href={previewHref || `/product/${product.id}`}
                  className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-200 hover:text-white transition-transform duration-150 ease-out hover:scale-120"
                >
                  <Eye className="w-6 h-6 transition-transform duration-150 ease-out group-hover:scale-105" />
                  <span className="text-sm font-medium transition-transform duration-150 ease-out group-hover:scale-105">Preview</span>
                </Link>
              </div>
            )}
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
              <span className="text-sm font-semibold">{product.price} USD</span>
            </div>
          </div>
        </div>
    </div>
  )

  if (showOverlay) return cardInner
  return (
    <Link href={previewHref || `/product/${product.id}`}>
      {cardInner}
    </Link>
  )
}
