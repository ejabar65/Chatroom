"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangleIcon } from "@/components/icons"

interface SpoilerContentProps {
  content: string
  spoilerText?: string
}

export function SpoilerContent({ content, spoilerText }: SpoilerContentProps) {
  const [isRevealed, setIsRevealed] = useState(false)

  if (isRevealed) {
    return <div className="prose prose-sm max-w-none">{content}</div>
  }

  return (
    <div className="p-6 bg-muted rounded-lg border-2 border-dashed border-border text-center">
      <AlertTriangleIcon className="w-12 h-12 mx-auto text-yellow-600 mb-3" />
      <h3 className="font-semibold text-lg mb-2">Spoiler Warning</h3>
      {spoilerText && <p className="text-sm text-muted-foreground mb-4">{spoilerText}</p>}
      <Button onClick={() => setIsRevealed(true)} variant="outline">
        Reveal Content
      </Button>
    </div>
  )
}
