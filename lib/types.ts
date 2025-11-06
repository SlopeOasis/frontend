export interface Product {
  id: string
  title: string
  image: string
  seller: string
  rating: number
  price: number
  category: string
  description?: string
  tags?: string[]
  fileSize?: string
  views?: number
  sales?: number
}

export interface User {
  id: string
  alias: string
  walletName: string
  avatar?: string
}
