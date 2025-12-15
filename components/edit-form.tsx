"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Check, Trash2 } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

const TAGS = ["ART", "MUSIC", "VIDEO", "CODE", "TEMPLATE", "PHOTO", "MODEL_3D", "FONT", "OTHER"]

type PostWithRating = {
  post: {
    id: number
    title: string
    description: string
    tags: string[]
    priceUSD: number
    copies: number
    status: "ACTIVE" | "DISABLED" | "USER_DELETED"
    previewImages?: string[]
    azBlobName?: string
  }
  ratingSummary: unknown
}

interface EditFormProps {
  postId: string
}

export function EditForm({ postId }: EditFormProps) {
  const router = useRouter()
  const { getToken } = useAuth()
  const postApiBase = process.env.NEXT_PUBLIC_POST_API_URL || "http://localhost:8081"

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [copies, setCopies] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [visible, setVisible] = useState<boolean>(true)
  const [newMainFile, setNewMainFile] = useState<File | null>(null)
  const [newPreviewImages, setNewPreviewImages] = useState<File[]>([])
  const [currentPreviewUrls, setCurrentPreviewUrls] = useState<string[]>([])
  const [currentFileSas, setCurrentFileSas] = useState<string | null>(null)
  const [currentFileName, setCurrentFileName] = useState<string | null>(null)

  const postIdNum = useMemo(() => Number(postId), [postId])

  // Load existing post details for prefill
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setIsLoading(true)
        setError(null)
        const token = await getToken({ template: "backendVerification" })
        const res = await fetch(`${postApiBase}/posts/${postIdNum}` , {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        if (res.status === 401) throw new Error("Failed to fetch post (401). Please sign in again.")
        if (!res.ok) throw new Error(`Failed to fetch post (${res.status})`)
        const data: PostWithRating = await res.json()
        const p = data.post
        if (!mounted) return
        setTitle(p.title || "")
        setDescription(p.description || "")
        setPrice((p.priceUSD ?? 0).toString())
        setCopies((p.copies ?? 0).toString())
        setSelectedTags(p.tags || [])
        setVisible(p.status !== "DISABLED")

        // Load SAS for existing previews
        const tokenSas = await getToken({ template: "backendVerification" })
        const previews = p.previewImages || []
        const previewSasPromises = previews.map(async (blob) => {
          try {
            const sasRes = await fetch(`${postApiBase}/posts/${p.id}/blob-sas?blobName=${encodeURIComponent(blob)}`, {
              headers: tokenSas ? { Authorization: `Bearer ${tokenSas}` } : undefined,
            })
            if (!sasRes.ok) return null
            const sas = await sasRes.text()
            return sas.replace(/^"|"$/g, "")
          } catch {
            return null
          }
        })
        const previewSas = (await Promise.all(previewSasPromises)).filter((u): u is string => !!u)
        setCurrentPreviewUrls(previewSas)

        // Load metadata and SAS for main file
        try {
          const metaRes = await fetch(`${postApiBase}/posts/${p.id}/blob-metadata`, {
            headers: tokenSas ? { Authorization: `Bearer ${tokenSas}` } : undefined,
          })
          if (metaRes.ok) {
            const meta = await metaRes.json()
            // Try common fields; fallback to parsing azBlobName
            const metaName = (meta?.name || meta?.blobName || meta?.blob || null) as string | null
            if (metaName) setCurrentFileName(metaName)
            else if (p.azBlobName) setCurrentFileName(p.azBlobName.split("/").pop() || null)
          } else if (p.azBlobName) {
            setCurrentFileName(p.azBlobName.split("/").pop() || null)
          }
        } catch {
          if (p.azBlobName) setCurrentFileName(p.azBlobName.split("/").pop() || null)
        }
        try {
          const fileSasRes = await fetch(`${postApiBase}/posts/${p.id}/blob-sas`, {
            headers: tokenSas ? { Authorization: `Bearer ${tokenSas}` } : undefined,
          })
          if (fileSasRes.ok) {
            const sas = await fileSasRes.text()
            setCurrentFileSas(sas.replace(/^"|"$/g, ""))
          }
        } catch {}
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "Failed to load post")
      } finally {
        if (mounted) setIsLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [postApiBase, postIdNum])

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag))
    } else if (selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleDeleteListing = async () => {
    try {
      const token = await getToken({ template: "backendVerification" })
      if (!token) return alert("Not authenticated. Please sign in.")
      const res = await fetch(`${postApiBase}/posts/${postIdNum}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "USER_DELETED" }),
      })
      if (!res.ok) throw new Error(`Delete failed (${res.status})`)
      router.push("/profile")
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : "Failed to delete listing")
    }
  }

  const handlePublish = async () => {
    try {
      if (!title || !description || !price || !copies) {
        alert("Please fill all required fields")
        return
      }
      const token = await getToken({ template: "backendVerification" })
      if (!token) return alert("Not authenticated. Please sign in.")

      // 0) Optionally replace main file
      if (newMainFile) {
        const form = new FormData()
        form.append("file", newMainFile)
        const fileRes = await fetch(`${postApiBase}/posts/${postIdNum}/file-multipart`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        })
        if (!fileRes.ok) throw new Error(`Main file update failed (${fileRes.status})`)
      }

      // 0b) Optionally replace preview images
      if (newPreviewImages.length > 0) {
        const form = new FormData()
        newPreviewImages.forEach((img) => form.append("previewImages", img))
        const prevRes = await fetch(`${postApiBase}/posts/${postIdNum}/previews-multipart`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        })
        if (!prevRes.ok) throw new Error(`Preview images update failed (${prevRes.status})`)
      }

      // 1) Update metadata
      const updateRes = await fetch(`${postApiBase}/posts/${postIdNum}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          tags: selectedTags,
          priceUSD: Number(price),
          copies: Number(copies),
          // previewImages: keep unchanged when omitted
        }),
      })
      if (!updateRes.ok) throw new Error(`Update failed (${updateRes.status})`)

      // 2) Update status based on visibility toggle
      const targetStatus = visible ? "ACTIVE" : "DISABLED"
      const statusRes = await fetch(`${postApiBase}/posts/${postIdNum}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: targetStatus }),
      })
      if (!statusRes.ok) throw new Error(`Status update failed (${statusRes.status})`)

      alert("Listing updated")
      router.push("/profile")
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : "Failed to save changes")
    }
  }

  if (isLoading) return <div className="text-muted-foreground">Loading…</div>
  if (error) return <div className="text-red-600">{error}</div>

  return (
    <div className="space-y-6">
      {/* Current Preview Images */}
      {currentPreviewUrls.length > 0 && (
        <div className="space-y-2">
          <Label>Current Preview Images</Label>
          <div className="grid grid-cols-5 gap-3">
            {currentPreviewUrls.map((url, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Current Preview ${idx + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Uploading new previews will replace the entire set.</p>
        </div>
      )}

      {/* Current Main File */}
      {(currentFileName || currentFileSas) && (
        <div className="space-y-2">
          <Label>Current File</Label>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">{currentFileName || "(name unavailable)"}</span>
            {currentFileSas && (
              <a href={currentFileSas} target="_blank" rel="noreferrer" className="text-primary underline">Download</a>
            )}
          </div>
        </div>
      )}
      {/* Replace Preview Images */}
      <div className="space-y-2">
        <Label>Preview Images (replace, up to 5)</Label>
        <div className="grid grid-cols-5 gap-3">
          {newPreviewImages.map((file, idx) => (
            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
              <img src={URL.createObjectURL(file)} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setNewPreviewImages(newPreviewImages.filter((_, i) => i !== idx))}
                className="absolute top-1 right-1 w-6 h-6 bg-background/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}

          {newPreviewImages.length < 5 && (
            <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-muted-foreground transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 bg-secondary/50">
              <span className="text-xs text-muted-foreground">Add</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = e.target.files
                  if (files) {
                    const arr = Array.from(files).slice(0, 5 - newPreviewImages.length)
                    setNewPreviewImages([...newPreviewImages, ...arr])
                  }
                }}
                className="hidden"
              />
            </label>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Leave empty to keep existing previews.</p>
      </div>

      {/* Replace Main File */}
      <div className="space-y-2">
        <Label htmlFor="mainFile">Replace Product File</Label>
        <div className="border-2 border-dashed border-border rounded-lg p-6 hover:border-muted-foreground transition-colors">
          <label htmlFor="mainFile" className="cursor-pointer flex flex-col items-center gap-3">
            <div className="text-center">
              <p className="text-sm font-medium">{newMainFile ? newMainFile.name : "Click to upload new file (optional)"}</p>
              <p className="text-xs text-muted-foreground mt-1">Any file type accepted</p>
            </div>
            <input id="mainFile" type="file" onChange={(e) => setNewMainFile(e.target.files?.[0] || null)} className="hidden" />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">Leave empty to keep existing file.</p>
      </div>
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={6} value={description} onChange={(e) => setDescription(e.target.value)} required />
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
                  isSelected ? "bg-blue-500 text-white border-blue-600 hover:bg-blue-600" : "border-border hover:bg-secondary"
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
        <Input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
      </div>

      {/* Copies */}
      <div className="space-y-2">
        <Label htmlFor="copies">Number of Copies Available *</Label>
        <Input id="copies" type="number" min="-1" value={copies} onChange={(e) => setCopies(e.target.value)} required />
        <p className="text-xs text-muted-foreground">Use -1 for unlimited copies</p>
      </div>

      {/* Visibility Toggle */}
      <div className="space-y-2">
        <Label>Visibility</Label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className={`px-3 py-1 rounded border text-sm ${visible ? "bg-green-500 text-white border-green-600" : "border-border"}`}
            aria-pressed={visible}
          >
            {visible ? "Active" : "Inactive"}
          </button>
          <span className="text-xs text-muted-foreground">Active = status ACTIVE, Inactive = status DISABLED</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="destructive" className="flex-1 bg-red-700" onClick={handleDeleteListing}>
          <Trash2 className="w-4 h-4 mr-2" /> Delete Listing
        </Button>
        <Button type="button" className="flex-1" onClick={handlePublish}>
          Publish Listing
        </Button>
      </div>
    </div>
  )
}
