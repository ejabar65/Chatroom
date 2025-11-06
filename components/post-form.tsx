"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Upload, X, Loader2, Plus } from "lucide-react"
import { createPost } from "@/lib/actions/posts"
import { getCommunities, createCommunity } from "@/lib/actions/communities"

interface PostFormProps {
  userId: string
}

export function PostForm({ userId }: PostFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [communities, setCommunities] = useState<any[]>([])
  const [showNewBoardDialog, setShowNewBoardDialog] = useState(false)
  const [newBoardName, setNewBoardName] = useState("")
  const [newBoardDescription, setNewBoardDescription] = useState("")
  const [isCreatingBoard, setIsCreatingBoard] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    communityId: "",
  })

  useEffect(() => {
    async function loadCommunities() {
      const result = await getCommunities()
      if (result.success && result.data) {
        setCommunities(result.data)
      }
    }
    loadCommunities()
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be less than 5MB")
        return
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file")
        return
      }

      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) {
      alert("Please enter a board name")
      return
    }

    setIsCreatingBoard(true)
    const formData = new FormData()
    formData.append("name", newBoardName)
    formData.append("displayName", newBoardName)
    formData.append("description", newBoardDescription)

    const result = await createCommunity(formData)

    if (result.success && result.data) {
      // Refresh communities list
      const communitiesResult = await getCommunities()
      if (communitiesResult.success && communitiesResult.data) {
        setCommunities(communitiesResult.data)
      }
      // Select the newly created community
      setFormData({ ...formData, communityId: result.data.id })
      setShowNewBoardDialog(false)
      setNewBoardName("")
      setNewBoardDescription("")
    } else {
      alert(result.error || "Failed to create board")
    }

    setIsCreatingBoard(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!imageFile) {
      alert("Please upload an image of your homework")
      return
    }

    if (!formData.title.trim()) {
      alert("Please enter a title")
      return
    }

    setIsSubmitting(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append("image", imageFile)
      formDataToSend.append("title", formData.title)
      formDataToSend.append("description", formData.description)
      formDataToSend.append("communityId", formData.communityId)
      formDataToSend.append("userId", userId)

      const result = await createPost(formDataToSend)

      if (result.success) {
        router.push("/")
        router.refresh()
      } else {
        alert(result.error || "Failed to create post")
      }
    } catch (error) {
      console.error("[v0] Error creating post:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Homework Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="image" className="text-card-foreground">
              Homework Image *
            </Label>
            {!imagePreview ? (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors bg-muted/30">
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  required
                />
                <label htmlFor="image" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm font-medium mb-1 text-card-foreground">Click to upload homework image</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, or WEBP (max 5MB)</p>
                </label>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Preview"
                  className="w-full rounded-lg border border-border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-card-foreground">
              Question Title *
            </Label>
            <Input
              id="title"
              placeholder="e.g., Help with quadratic equations"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              maxLength={200}
              className="bg-background text-foreground border-border"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="community" className="text-card-foreground">
                Board
              </Label>
              <Dialog open={showNewBoardDialog} onOpenChange={setShowNewBoardDialog}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-primary hover:text-primary hover:bg-primary/10"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    New Board
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="text-card-foreground">Create New Board</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Create a new board for organizing homework questions
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="boardName" className="text-card-foreground">
                        Board Name *
                      </Label>
                      <Input
                        id="boardName"
                        placeholder="e.g., AP Calculus"
                        value={newBoardName}
                        onChange={(e) => setNewBoardName(e.target.value)}
                        className="bg-background text-foreground border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="boardDescription" className="text-card-foreground">
                        Description
                      </Label>
                      <Textarea
                        id="boardDescription"
                        placeholder="What is this board for?"
                        value={newBoardDescription}
                        onChange={(e) => setNewBoardDescription(e.target.value)}
                        rows={3}
                        className="bg-background text-foreground border-border"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewBoardDialog(false)}
                      disabled={isCreatingBoard}
                      className="border-border"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCreateBoard}
                      disabled={isCreatingBoard}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {isCreatingBoard ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Board"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <Select
              value={formData.communityId}
              onValueChange={(value) => setFormData({ ...formData, communityId: value })}
            >
              <SelectTrigger id="community" className="bg-background text-foreground border-border">
                <SelectValue placeholder="Select a board" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {communities.map((community) => (
                  <SelectItem
                    key={community.id}
                    value={community.id}
                    className="text-popover-foreground hover:bg-accent"
                  >
                    {community.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-card-foreground">
              Additional Details
            </Label>
            <Textarea
              id="description"
              placeholder="Describe what you're struggling with or what specific help you need..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              maxLength={1000}
              className="bg-background text-foreground border-border"
            />
            <p className="text-xs text-muted-foreground">{formData.description.length}/1000 characters</p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="flex-1 border-border text-foreground hover:bg-accent"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !imageFile}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              "Post Question"
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
