"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { BookmarkIcon, PlusIcon } from "@/components/icons"
import { getUserCollections, createCollection, addPostToCollection } from "@/lib/actions/user-features"
import { useRouter } from 'next/navigation'

interface AddToCollectionButtonProps {
  postId: string
  variant?: "ghost" | "outline" | "default"
  size?: "sm" | "default"
}

export function AddToCollectionButton({ postId, variant = "ghost", size = "sm" }: AddToCollectionButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [collections, setCollections] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showNewCollection, setShowNewCollection] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState("")
  const [newCollectionDescription, setNewCollectionDescription] = useState("")
  const [isPublic, setIsPublic] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadCollections()
    }
  }, [isOpen])

  const loadCollections = async () => {
    setIsLoading(true)
    const result = await getUserCollections("")
    if (result.success && result.data) {
      setCollections(result.data)
    }
    setIsLoading(false)
  }

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      alert("Collection name is required")
      return
    }

    setIsLoading(true)
    const result = await createCollection(newCollectionName, newCollectionDescription, isPublic)
    if (result.success && result.data) {
      await addPostToCollection(result.data.id, postId)
      setIsOpen(false)
      setShowNewCollection(false)
      setNewCollectionName("")
      setNewCollectionDescription("")
      router.refresh()
    } else {
      alert(result.error || "Failed to create collection")
    }
    setIsLoading(false)
  }

  const handleAddToCollection = async (collectionId: string) => {
    setIsLoading(true)
    const result = await addPostToCollection(collectionId, postId)
    if (result.success) {
      setIsOpen(false)
      router.refresh()
    } else {
      alert(result.error || "Failed to add to collection")
    }
    setIsLoading(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <BookmarkIcon className="w-4 h-4 mr-2" />
          Save to Collection
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save to Collection</DialogTitle>
          <DialogDescription>Choose a collection or create a new one</DialogDescription>
        </DialogHeader>

        {!showNewCollection ? (
          <div className="space-y-4 py-4">
            {isLoading ? (
              <p className="text-center text-muted-foreground">Loading collections...</p>
            ) : collections.length === 0 ? (
              <p className="text-center text-muted-foreground">No collections yet. Create your first one!</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {collections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => handleAddToCollection(collection.id)}
                    className="w-full p-3 text-left border rounded-lg hover:bg-accent transition-colors"
                    disabled={isLoading}
                  >
                    <p className="font-medium">{collection.name}</p>
                    {collection.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{collection.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {collection.collection_posts?.[0]?.count || 0} posts
                    </p>
                  </button>
                ))}
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowNewCollection(true)}
              disabled={isLoading}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create New Collection
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Collection Name *</Label>
              <Input
                id="name"
                placeholder="My Saved Posts"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Optional description"
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
                maxLength={200}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="public" checked={isPublic} onCheckedChange={(checked) => setIsPublic(checked === true)} />
              <label htmlFor="public" className="text-sm cursor-pointer">
                Make this collection public
              </label>
            </div>
          </div>
        )}

        <DialogFooter>
          {showNewCollection ? (
            <>
              <Button variant="outline" onClick={() => setShowNewCollection(false)} disabled={isLoading}>
                Back
              </Button>
              <Button onClick={handleCreateCollection} disabled={isLoading || !newCollectionName.trim()}>
                {isLoading ? "Creating..." : "Create & Add"}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
