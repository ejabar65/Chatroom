"use client"

import { PlayIcon, PauseIcon } from "@heroicons/react/24/solid"
import { cn } from "@/lib/utils"

interface VinylPlayerProps {
  isPlaying: boolean
  thumbnail?: string
  title: string
  artist: string
  onTogglePlay: () => void
}

export function VinylPlayer({ isPlaying, thumbnail, title, artist, onTogglePlay }: VinylPlayerProps) {
  return (
    <div className="relative flex flex-col items-center justify-center p-6">
      <div className="relative cursor-pointer group" onClick={onTogglePlay}>
        {/* Outer vinyl disc */}
        <div
          className={cn(
            "w-48 h-48 rounded-full bg-gradient-to-br from-gray-900 via-gray-800 to-black shadow-2xl relative overflow-hidden transition-transform",
            isPlaying && "animate-spin-slow",
          )}
          style={{ animationDuration: "3s" }}
        >
          {/* Vinyl grooves */}
          <div className="absolute inset-0">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full border border-gray-700/30"
                style={{
                  inset: `${8 + i * 6}px`,
                }}
              />
            ))}
          </div>

          {/* Center label with album art */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-background border-4 border-gray-800 shadow-xl overflow-hidden flex items-center justify-center">
              {thumbnail ? (
                <img src={thumbnail || "/placeholder.svg"} alt={title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40" />
              )}
            </div>
          </div>

          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
        </div>

        {/* Play/Pause overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border-2 border-white/80">
            {isPlaying ? (
              <PauseIcon className="h-8 w-8 text-white" />
            ) : (
              <PlayIcon className="h-8 w-8 text-white ml-1" />
            )}
          </div>
        </div>

        {/* Tonearm */}
        <div
          className={cn(
            "absolute -right-8 top-1/4 w-32 h-2 origin-right transition-transform duration-700",
            isPlaying ? "rotate-12" : "rotate-0",
          )}
        >
          {/* Arm base */}
          <div className="absolute -right-2 -top-2 w-6 h-6 rounded-full bg-gray-700 shadow-lg" />

          {/* Arm */}
          <div className="absolute right-0 top-0 w-28 h-2 bg-gradient-to-r from-gray-600 to-gray-400 rounded-l-full shadow-md">
            {/* Needle holder */}
            <div className="absolute -left-3 -top-1 w-4 h-4 rounded-full bg-gray-500 shadow-md" />

            {/* Needle */}
            <div className="absolute -left-4 top-1/2 w-2 h-6 -translate-y-1/2 bg-gradient-to-b from-gray-400 to-gray-600 rounded-b" />
          </div>
        </div>
      </div>

      <div className="mt-6 text-center max-w-full">
        <p className="font-semibold text-lg truncate px-4">{title}</p>
        <p className="text-sm text-muted-foreground truncate px-4">{artist}</p>
      </div>
    </div>
  )
}
