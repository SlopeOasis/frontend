import { Header } from "@/components/header"
import { ManageListings } from "@/components/manage-listings"

export default function ManagePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <ManageListings />
      </main>
    </div>
  )
}
