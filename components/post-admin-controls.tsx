"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SettingsIcon, PinIcon, LockIcon, TagIconComponent } from "@/components/icons"
import { pinPost, unpinPost, lockPost, unlockPost, updatePostFlair } from "@/lib/actions/posts"
import { useRouter } from 'next/navigation'

interface PostAdminControlsProps {
  postId: string
  isPinned: boolean
  isLocked: boolean
  lockReason?: string | null
  flairText?: string | null
  flairColor?: string | null
}

export function PostAdminControls({
  postId,
  isPinned,
  isLocked,
  lockReason,
  flairText,
  flairColor,
}: PostAdminControlsProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [showLockDialog, setShowLockDialog] = useState(false)
  const [showFlairDialog, setShowFlairDialog] = useState(false)
  const [lockReasonInput, setLockReasonInput] = useState(lockReason || "")
  const [flairTextInput, setFlairTextInput] = useState(flairText || "")
  const [flairColorInput, setFlairColorInput] = useState(flairColor || "#3b82f6")

  const handlePin = async () => {
    setIsProcessing(true)
    const result = isPinned ? await unpinPost(postId) : await pinPost(postId)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error)
    }
    setIsProcessing(false)
  }

  const handleLock = async () => {
    if (!lockReasonInput.trim()) {
      alert("Please provide a reason for locking")
      return
    }
    setIsProcessing(true)
    const result = await lockPost(postId, lockReasonInput.trim())
    if (result.success) {
      setShowLockDialog(false)
      router.refresh()
    } else {
      alert(result.error)
    }
    setIsProcessing(false)
  }

  const handleUnlock = async () => {
    setIsProcessing(true)
    const result = await unlockPost(postId)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error)
    }
    setIsProcessing(false)
  }

  const handleUpdateFlair = async () => {
    setIsProcessing(true)
    const result = await updatePostFlair(postId, flairTextInput.trim(), flairColorInput)
    if (result.success) {
      setShowFlairDialog(false)
      router.refresh()
    } else {
      alert(result.error)
    }
    setIsProcessing(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <SettingsIcon className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handlePin} disabled={isProcessing}>
            <PinIcon className="w-4 h-4 mr-2" />
            {isPinned ? "Unpin Post" : "Pin Post"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => (isLocked ? handleUnlock() : setShowLockDialog(true))}
            disabled={isProcessing}
          >
            <LockIcon className="w-4 h-4 mr-2" />
            {isLocked ? "Unlock Post" : "Lock Post"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowFlairDialog(true)}>
            <TagIconComponent className="w-4 h-4 mr-2" />
            Edit Flair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Lock Dialog */}
      <Dialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lock Post</DialogTitle>
            <DialogDescription>
              Locking this post will prevent new comments. Provide a reason for locking.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lockReason">Lock Reason *</Label>
              <Textarea
                id="lockReason"
                placeholder="e.g., Off-topic discussion, Resolved, Duplicate"
                value={lockReasonInput}
                onChange={(e) => setLockReasonInput(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLockDialog(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleLock} disabled={isProcessing || !lockReasonInput.trim()}>
              Lock Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Flair Dialog */}
      <Dialog open={showFlairDialog} onOpenChange={setShowFlairDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Post Flair</DialogTitle>
            <DialogDescription>Add a custom flair to categorize or highlight this post.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="flairText">Flair Text</Label>
              <Input
                id="flairText"
                placeholder="e.g., Urgent, Solved, Important"
                value={flairTextInput}
                onChange={(e) => setFlairTextInput(e.target.value)}
                maxLength={20}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flairColor">Flair Color</Label>
              <div className="flex gap-2">
                <Input
                  id="flairColor"
                  type="color"
                  value={flairColorInput}
                  onChange={(e) => setFlairColorInput(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={flairColorInput}
                  onChange={(e) => setFlairColorInput(e.target.value)}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>
            {flairTextInput && (
              <div className="p-3 rounded-lg border">
                <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                <span
                  className="inline-block px-2 py-1 rounded text-xs font-medium"
                  style={{ backgroundColor: flairColorInput, color: "#fff" }}
                >
                  {flairTextInput}
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFlairDialog(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleUpdateFlair} disabled={isProcessing}>
              Save Flair
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
