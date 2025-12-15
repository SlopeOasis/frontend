export interface Product {
  id: string
  title: string
  image: string
  images?: string[]
  seller: string
  rating: number
  ratingCount?: number
  price: number
  priceUSD?: number
  category: string
  description?: string
  tags?: string[]
  fileSize?: string
  fileName?: string
  fileVersion?: number
  copies?: number
  uploadTime?: string
  lastTimeModified?: string
  contentType?: string
  views?: number
  sales?: number
}

export interface User {
  id: string
  alias: string
  walletName: string
  avatar?: string
}
