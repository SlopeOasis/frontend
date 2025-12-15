import { Header } from "@/components/header"
import { EditForm } from "@/components/edit-form"

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Edit Listing</h1>
        <EditForm postId={id} />
      </main>
    </div>
  )
}
