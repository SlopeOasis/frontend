import { Header } from "@/components/header"
import { ProfileView } from "@/components/profile-view"
import { mockProducts } from "@/lib/mock-data"

interface ProfilePageProps {
  params: {
    username: string
  }
}

export default function ProfilePage({ params }: ProfilePageProps) {
  // Filter products by seller
  const userProducts = mockProducts.filter((p) => p.seller === params.username)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ProfileView username={params.username} products={userProducts} />
    </div>
  )
}
