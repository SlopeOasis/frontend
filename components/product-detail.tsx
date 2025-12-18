"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@clerk/nextjs"
import { Star, ChevronLeft, UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Product } from "@/lib/types"

interface ProductDetailProps {
  product: Product
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [buyState, setBuyState] = useState<
    | "idle"
    | "buyersNotLoggedIn"
    | "buyersBuyingWalletNotConnected"
    | "bought"
    | "creating"
    | "confirm"
    | "pending"
    | "error"
  >("idle")
  const images = (product.images && product.images.length > 0 ? product.images : [product.image]).filter(Boolean)

  const { getToken, isSignedIn, userId } = useAuth()

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      if (!isSignedIn || !userId) return
      const postApiBase = process.env.NEXT_PUBLIC_POST_API_URL || "http://localhost:8081"

      try {
        const token = await getToken({ template: "backendVerification" })
        if (!token) return

        const res = await fetch(`${postApiBase}/posts/${product.id}`, {
          cache: "no-store",
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = (await res.json()) as { post?: { buyers?: string[] } }
        const buyers = data?.post?.buyers || []
        if (!cancelled && buyers.includes(userId)) {
          setBuyState("bought")
        }
      } catch {
        // Ignore; stay in current UI state
      }
    })()

    return () => {
      cancelled = true
    }
  }, [getToken, isSignedIn, product.id, userId])


  async function downloadBoughtFile() {
    if (!isSignedIn) {
      setBuyState("buyersNotLoggedIn")
      return
    }

    const postApiBase = process.env.NEXT_PUBLIC_POST_API_URL || "http://localhost:8081"
    const token = await getToken({ template: "backendVerification" })
    if (!token) {
      setBuyState("buyersNotLoggedIn")
      return
    }

    const sasRes = await fetch(`${postApiBase}/posts/${product.id}/blob-sas`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!sasRes.ok) {
      setBuyState("error")
      return
    }

    const sasRaw = await sasRes.text()
    const sasUrl = sasRaw.replace(/^"|"$/g, "")
    window.location.assign(sasUrl)
  }


  async function buyNowFunction() {
    try {
      if (!isSignedIn) {
        setBuyState("buyersNotLoggedIn")
        return
      }

      const userApiBase = process.env.NEXT_PUBLIC_USER_API_URL || "http://localhost:8080"

      const clerkToken = await getToken({ template: "backendVerification" })
      if (!clerkToken) {
        setBuyState("buyersNotLoggedIn")
        return
      }

      const walletStatusRes = await fetch(`${userApiBase}/users/pol-wallet-status`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${clerkToken}`,
        },
      })

      if (!walletStatusRes.ok) {
        setBuyState(walletStatusRes.status === 401 ? "buyersNotLoggedIn" : "buyersBuyingWalletNotConnected")
        return
      }

      const walletVerified = (await walletStatusRes.json()) as boolean
      if (!walletVerified) {
        setBuyState("buyersBuyingWalletNotConnected")
        return
      }

      setBuyState("creating")

      const res = await fetch(`${process.env.NEXT_PUBLIC_PAYMENT_API_URL}/paymentIntents/intent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${clerkToken}`,
        },
        body: JSON.stringify({
          postId: product.id,
        }),
      })

      if (!res.ok) throw new Error("Failed to create payment intent")

      const intent = await res.json()

      if (!window.ethereum) {
        alert("MetaMask is required")
        setBuyState("idle")
        return
      }

      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x89" }],
      })

      setBuyState("confirm")

      const [from] = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      const walletAddressRes = await fetch(
        `${userApiBase}/users/public/pol-wallet-addres?clerkId=${encodeURIComponent(userId)}`,
        {
          method: "GET",
        },
      )

      if (!walletAddressRes.ok) {
        setBuyState("buyersBuyingWalletNotConnected")
        return
      }

      const buyerWalletFromDb = (await walletAddressRes.text()).replace(/^"|"$/g, "")

      if (from.toLowerCase() !== buyerWalletFromDb.toLowerCase()) {
        alert("Please switch MetaMask to your verified Polygon wallet")
        setBuyState("buyersBuyingWalletNotConnected")
        return
      }
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from,
            to: intent.sellerWalletAddress,
            value: "0x" + BigInt(String(intent.amountWei)).toString(16),
          },
        ],
      })

      const confirmToken = await getToken({ template: "backendVerification" })
      if (!confirmToken) {
        setBuyState("buyersNotLoggedIn")
        return
      }

      setBuyState("pending")

      const confirmUrl = `${process.env.NEXT_PUBLIC_PAYMENT_API_URL}/payments/confirm`
      const confirmBody = JSON.stringify({
        paymentId: intent.paymentId,
        txHash,
      })

      // Poll until mined/verified (backend returns 202 while receipt is missing)
      for (let attempt = 0; attempt < 30; attempt++) {
        const confirmRes = await fetch(confirmUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${confirmToken}`,
          },
          body: confirmBody,
        })

        if (confirmRes.status === 202) {
          await new Promise((r) => setTimeout(r, 2000))
          continue
        }

        if (!confirmRes.ok) {
          const msg = await confirmRes.text().catch(() => "")
          console.error("Payment confirm failed", confirmRes.status, msg)
          setBuyState("error")
          return
        }

        // Paid
        setBuyState("bought")
        return
      }

      console.error("Payment confirm timed out")
      setBuyState("error")
    } catch (err: any) {
      console.error(err)
      setBuyState("error")

      if (err.code === 4001) {
        alert("Transaction rejected")
        setBuyState("idle")
      }
    }
  }




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

            <div className="text-3xl font-bold mb-6">{product.priceUSD ?? product.price} USD</div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              size="lg"
              className="flex-1"
              onClick={buyState === "bought" ? downloadBoughtFile : buyNowFunction}
              disabled={buyState === "creating" || buyState === "confirm" || buyState === "pending"}
            >
              {buyState === "bought" && "Download"}
              {buyState === "buyersNotLoggedIn" && "Log in to buy"}
              {buyState === "buyersBuyingWalletNotConnected" && "Connect POL wallet"}
              {buyState === "idle" && "Buy Now"}
              {buyState === "creating" && "Preparing payment…"}
              {buyState === "confirm" && "Confirm in MetaMask"}
              {buyState === "pending" && "Payment pending…"}
              {buyState === "error" && "Try again"}
            </Button>
            {buyState === "buyersBuyingWalletNotConnected" && (
              <p className="text-sm text-muted-foreground mt-2">
                connect your Polygon wallet under profile settings to continue shopping
              </p>
            )}
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
                    <dd className="font-medium text-right wrap-break-word">{product.fileName}</dd>
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
