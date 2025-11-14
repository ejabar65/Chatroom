"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
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
} from "@/components/ui/dialog"
import { Upload, X, Loader2, Plus } from 'lucide-react'
import { createPost } from "@/lib/actions/posts"
import { getCommunities, createCommunity } from "@/lib/actions/communities"

interface PostFormProps {
  userId: string
}

const SUBJECTS = [
  "Math",
  "Science",
  "English",
  "History",
  "Foreign Language",
  "Computer Science",
  "Art",
  "Music",
  "Physical Education",
  "Curtis",
  "Cross",
  "Whitehead",
  "Gurrero",
  "Mendoza",
  "Kaminski",
  "Cole",
  "Hodgeson",
  "Thompson",
  "Juco",
  "McDaniel",
  "Vanny",
  "Sherman",
  "Mathis",
  "Reyaz",
  "Shumm",
  "Barnett",
  "Rose",
  "KING CHAPMAN",
  "Other",
]

export function PostForm({ userId }: PostFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [communities, setCommunities] = useState<any[]>([])
  const [showNewBoardDialog, setShowNewBoardDialog] = useState(false)
  const [isCreatingBoard, setIsCreatingBoard] = useState(false)
  const [newBoard, setNewBoard] = useState({ name: "", description: "" })
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    communityId: "",
  })

  useEffect(() => {
    async function fetchCommunities() {
      const result = await getCommunities()
      if (result.success && result.data) {
        setCommunities(result.data)
      }
    }
    fetchCommunities()
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be less than 5MB")
        return
      }

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
    if (!newBoard.name.trim()) {
      alert("Please enter a board name")
      return
    }

    setIsCreatingBoard(true)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append("name", newBoard.name)
      formDataToSend.append("displayName", newBoard.name)
      formDataToSend.append("description", newBoard.description)

      const result = await createCommunity(formDataToSend)

      if (result.success && result.data) {
        setCommunities([result.data, ...communities])
        setFormData({ ...formData, communityId: result.data.id })
        setShowNewBoardDialog(false)
        setNewBoard({ name: "", description: "" })
      } else {
        alert(result.error || "Failed to create board")
      }
    } catch (error) {
      console.error("[v0] Error creating board:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setIsCreatingBoard(false)
    }
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

    if (!formData.communityId) {
      alert("Please select a board for your post")
      return
    }

    setIsSubmitting(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append("image", imageFile)
      formDataToSend.append("title", formData.title)
      formDataToSend.append("description", formData.description)
      formDataToSend.append("subject", formData.subject)
      formDataToSend.append("userId", userId)
      formDataToSend.append("communityId", formData.communityId)

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
    <>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Homework Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="image">Homework Image *</label>
              {!imagePreview ? (
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
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
                    <p className="text-sm font-medium mb-1">Click to upload homework image</p>
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

            <div className="space-y-2">
              <Label htmlFor="title">Question Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Help with quadratic equations"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="board">Board *</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.communityId}
                  onValueChange={(value) => setFormData({ ...formData, communityId: value })}
                  required
                >
                  <SelectTrigger id="board" className="flex-1">
                    <SelectValue placeholder="Select a board" />
                  </SelectTrigger>
                  <SelectContent>
                    {communities.map((community) => (
                      <SelectItem key={community.id} value={community.id}>
                        {community.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowNewBoardDialog(true)}
                  title="Create new board"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Posts must be assigned to a board</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={formData.subject} onValueChange={(value) => setFormData({ ...formData, subject: value })}>
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Additional Details</Label>
              <Textarea
                id="description"
                placeholder="Describe what you're struggling with or what specific help you need..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                maxLength={1000}
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
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !imageFile || !formData.communityId}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
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

      <Dialog open={showNewBoardDialog} onOpenChange={setShowNewBoardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
            <DialogDescription>Create a new board for organizing homework posts by topic or class.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="boardName">Board Name *</Label>
              <Input
                id="boardName"
                placeholder="e.g., AP Calculus, Chemistry 101"
                value={newBoard.name}
                onChange={(e) => setNewBoard({ ...newBoard, name: e.target.value })}
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="boardDescription">Description (Optional)</Label>
              <Textarea
                id="boardDescription"
                placeholder="Describe what this board is for..."
                value={newBoard.description}
                onChange={(e) => setNewBoard({ ...newBoard, description: e.target.value })}
                rows={3}
                maxLength={200}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowNewBoardDialog(false)
                setNewBoard({ name: "", description: "" })
              }}
              disabled={isCreatingBoard}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleCreateBoard} disabled={isCreatingBoard || !newBoard.name.trim()}>
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
    </>
  )
}
