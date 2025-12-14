"use client"

import type React from "react"

import { useState } from "react"
import { Upload, X, Plus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

const TAGS = ["ART", "MUSIC", "VIDEO", "CODE", "TEMPLATE", "PHOTO", "MODEL_3D", "FONT", "OTHER"]

export function UploadForm() {
  const { getToken } = useAuth()
  const router = useRouter()
  const [previewImages, setPreviewImages] = useState<File[]>([])
  const [mainFile, setMainFile] = useState<File | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    copies: "",
  })

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && previewImages.length < 5) {
      const newImages = Array.from(files).slice(0, 5 - previewImages.length)
      setPreviewImages([...previewImages, ...newImages])
    }
  }

  const removeImage = (index: number) => {
    setPreviewImages(previewImages.filter((_, i) => i !== index))
  }

  const handleMainFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setMainFile(file)
    }
  }

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag))
    } else if (selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault()
    
    if (!formData.title || !formData.description || !formData.price || !mainFile) {
      alert("Please fill all required fields")
      return
    }

    if (!formData.copies) {
      alert("Please specify number of copies")
      return
    }

    setIsLoading(true)
    try {
      const token = await getToken({ template: "backendVerification" })
      if (!token) {
        alert("Not authenticated. Please sign in.")
        return
      }

      const formBody = new FormData()
      
      // Add main file
      formBody.append("file", mainFile)
      
      // Add preview images
      previewImages.forEach((img) => {
        formBody.append("previewImages", img)
      })
      
      // Add form data
      formBody.append("title", formData.title)
      formBody.append("description", formData.description)
      formBody.append("priceUSD", formData.price)
      formBody.append("copies", formData.copies)
      formBody.append("tags", selectedTags.join(","))
      formBody.append("status", isDraft ? "DISABLED" : "ACTIVE")

      const postApiBase = process.env.NEXT_PUBLIC_POST_API_URL || "http://localhost:8081"
      const res = await fetch(`${postApiBase}/posts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formBody,
      })

      if (!res.ok) {
        const error = await res.text()
        throw new Error(`Failed to create listing: ${res.status} ${error}`)
      }

      const result = await res.json()
      alert(isDraft ? "Listing saved as draft!" : "Listing published successfully!")
      router.push("/profile")
    } catch (e) {
      console.error(e)
      alert(`Error: ${e instanceof Error ? e.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Preview Images Upload */}
      <div className="space-y-2">
        <Label>Preview Images (up to 5)</Label>
        <div className="grid grid-cols-5 gap-3">
          {previewImages.map((file, idx) => (
            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
              <img src={URL.createObjectURL(file)} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 w-6 h-6 bg-background/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {previewImages.length < 5 && (
            <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-muted-foreground transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 bg-secondary/50">
              <Upload className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Add</span>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
            </label>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Upload up to 5 preview images. First image will be the cover.</p>
      </div>

      {/* Main File Upload */}
      <div className="space-y-2">
        <Label htmlFor="mainFile">Product File *</Label>
        <div className="border-2 border-dashed border-border rounded-lg p-6 hover:border-muted-foreground transition-colors">
          <label htmlFor="mainFile" className="cursor-pointer flex flex-col items-center gap-3">
            <Upload className="w-8 h-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">{mainFile ? mainFile.name : "Click to upload main file"}</p>
              <p className="text-xs text-muted-foreground mt-1">Any file type accepted</p>
            </div>
            <input id="mainFile" type="file" onChange={handleMainFileUpload} className="hidden" required />
          </label>
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="Enter product title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe your product in detail..."
          rows={6}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      {/* Tags */}
      <div className="space-y-3">
        <Label>Tags (up to 5)</Label>
        <div className="grid grid-cols-3 gap-2">
          {TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-2 rounded border text-sm transition-colors flex items-center justify-center gap-1 ${
                  isSelected
                    ? "bg-blue-500 text-white border-blue-600 hover:bg-blue-600"
                    : "border-border hover:bg-secondary"
                }`}
              >
                {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                <span>{tag}</span>
              </button>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground">Selected: {selectedTags.length} / 5</p>
      </div>

      {/* Price */}
      <div className="space-y-2">
        <Label htmlFor="price">Price (USD) *</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          required
        />
      </div>

      {/* Copies */}
      <div className="space-y-2">
        <Label htmlFor="copies">Number of Copies Available *</Label>
        <Input
          id="copies"
          type="number"
          min="-1"
          placeholder="Enter number or -1 for unlimited"
          value={formData.copies}
          onChange={(e) => setFormData({ ...formData, copies: e.target.value })}
          required
        />
        <p className="text-xs text-muted-foreground">Use -1 for unlimited copies</p>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          className="flex-1 bg-transparent"
          onClick={(e) => handleSubmit(e as React.FormEvent, true)}
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save as Draft"}
        </Button>
        <Button 
          type="button"
          className="flex-1"
          onClick={(e) => handleSubmit(e as React.FormEvent, false)}
          disabled={isLoading}
        >
          {isLoading ? "Publishing..." : "Publish Listing"}
        </Button>
      </div>
    </form>
  )
}
