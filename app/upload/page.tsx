import { Header } from "@/components/header"
import { UploadForm } from "@/components/upload-form"

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">List a New Item</h1>
          <p className="text-muted-foreground mb-8">Fill out the details below to list your item on SlopeOasis</p>
          <UploadForm />
        </div>
      </main>
    </div>
  )
}
