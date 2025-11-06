import Link from "next/link"
import { Search, User } from "lucide-react"
import Image from "next/image"

export function Header() {
  return (
    <header className="border-b border-border bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-4Gi5slRBIrpvjeimKEmwEAbgjBSOX1.png"
              alt="SlopeOasis"
              width={40}
              height={40}
              className="rounded-full"
            />
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search the slope . . ."
                className="w-full pl-10 pr-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border border-border rounded hover:bg-secondary transition-colors text-sm">
              Filters
            </button>
            <button className="px-4 py-2 border border-border rounded hover:bg-secondary transition-colors text-sm">
              Connect
            </button>
            <Link href="/profile" className="p-2 hover:bg-secondary rounded-full transition-colors">
              <User className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-4 mt-4 text-sm overflow-x-auto">
          {["All", "Code", "Unity", "Unreal", "Images", "Videos", "Audio", "More"].map((category) => (
            <button key={category} className="px-3 py-1 whitespace-nowrap hover:bg-secondary rounded transition-colors">
              {category}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
