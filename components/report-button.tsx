"use client"

import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { FlagIcon } from "@/components/icons"
import { createReport } from "@/lib/actions/reports"
import { useRouter } from 'next/navigation'

interface ReportButtonProps {
  targetType: "user" | "post" | "comment"
  targetId: string
  variant?: "ghost" | "outline" | "default"
  size?: "sm" | "default"
}

export function ReportButton({ targetType, targetId, variant = "ghost", size = "sm" }: ReportButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert("Please provide a reason for reporting")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createReport(targetType, targetId, reason.trim())
      if (result.success) {
        setIsOpen(false)
        setReason("")
        alert("Report submitted successfully. Our team will review it.")
        router.refresh()
      } else {
        alert(result.error || "Failed to submit report")
      }
    } catch (error) {
      alert("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <FlagIcon className="w-4 h-4 mr-2" />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report {targetType}</DialogTitle>
          <DialogDescription>
            Help us keep the community safe by reporting inappropriate content or behavior.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Report *</Label>
            <Textarea
              id="reason"
              placeholder="Please describe why you are reporting this..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">{reason.length}/500 characters</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !reason.trim()}>
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
