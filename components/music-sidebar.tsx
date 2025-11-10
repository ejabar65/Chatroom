"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import {
  MagnifyingGlassIcon,
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  XMarkIcon,
  PlusIcon,
  Bars3Icon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline"
import type { Track, QueueItem } from "@/lib/types/music"

interface ContextMenu {
  x: number
  y: number
  track: Track | QueueItem
  type: "search" | "queue"
}

export function MusicSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Track[]>([])
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [currentTrack, setCurrentTrack] = useState<QueueItem | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const playerRef = useRef<any>(null)
  const [playerReady, setPlayerReady] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && !window.YT) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

      window.onYouTubeIframeAPIReady = () => {
        setPlayerReady(true)
      }
    } else if (window.YT) {
      setPlayerReady(true)
    }
  }, [])

  useEffect(() => {
    if (playerReady && !playerRef.current && isOpen) {
      console.log("[v0] Initializing YouTube player")
      playerRef.current = new window.YT.Player("youtube-player", {
        height: "0",
        width: "0",
        playerVars: {
          autoplay: 1,
          controls: 0,
        },
        events: {
          onReady: (event: any) => {
            console.log("[v0] YouTube player ready")
          },
          onStateChange: (event: any) => {
            console.log("[v0] Player state:", event.data)
            if (event.data === window.YT.PlayerState.ENDED) {
              handleNext()
            }
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true)
            }
            if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false)
            }
          },
          onError: (event: any) => {
            console.error("[v0] YouTube player error:", event.data)
          },
        },
      })
    }
  }, [playerReady, isOpen])

  const searchMusic = async () => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    try {
      console.log("[v0] Searching for:", searchQuery)
      const response = await fetch(`/api/music/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()

      if (response.ok) {
        console.log("[v0] Found tracks:", data.tracks.length)
        setSearchResults(data.tracks)
      } else {
        console.error("[v0] Search error:", data.error)
      }
    } catch (error) {
      console.error("[v0] Search error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addToQueue = (track: Track) => {
    const queueItem: QueueItem = {
      ...track,
      queueId: `${track.id}-${Date.now()}`,
      addedAt: Date.now(),
    }
    console.log("[v0] Adding to queue:", queueItem.title)
    setQueue((prev) => [...prev, queueItem])

    if (!currentTrack) {
      playTrack(queueItem)
    }
  }

  const playTrack = (track: QueueItem) => {
    console.log("[v0] Playing track:", track.title, "Video ID:", track.videoId)
    setCurrentTrack(track)
    if (playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(track.videoId)
      setIsPlaying(true)
    } else {
      console.error("[v0] Player not ready")
    }
  }

  const togglePlayPause = () => {
    if (!playerRef.current) {
      console.error("[v0] Player not initialized")
      return
    }

    console.log("[v0] Toggle play/pause, current state:", isPlaying)
    if (isPlaying) {
      playerRef.current.pauseVideo()
    } else {
      playerRef.current.playVideo()
    }
  }

  const handleNext = () => {
    if (queue.length === 0) {
      setCurrentTrack(null)
      setIsPlaying(false)
      return
    }

    const currentIndex = queue.findIndex((t) => t.queueId === currentTrack?.queueId)
    const nextIndex = currentIndex + 1

    if (nextIndex < queue.length) {
      playTrack(queue[nextIndex])
    } else {
      setCurrentTrack(null)
      setIsPlaying(false)
    }
  }

  const removeFromQueue = (queueId: string) => {
    setQueue((prev) => prev.filter((t) => t.queueId !== queueId))
  }

  const shuffleQueue = () => {
    const shuffled = [...queue].sort(() => Math.random() - 0.5)
    setQueue(shuffled)
  }

  const playNow = (track: Track | QueueItem) => {
    const queueItem: QueueItem =
      "queueId" in track
        ? track
        : {
            ...track,
            queueId: `${track.id}-${Date.now()}`,
            addedAt: Date.now(),
          }

    if (!("queueId" in track)) {
      setQueue((prev) => [queueItem, ...prev])
    }

    playTrack(queueItem)
  }

  const handleContextMenu = (e: React.MouseEvent, track: Track | QueueItem, type: "search" | "queue") => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      track,
      type,
    })
  }

  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  return (
    <>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg"
        size="icon"
      >
        {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
      </Button>

      <div
        className={`fixed top-0 right-0 h-screen w-96 bg-background border-l border-border shadow-2xl z-40 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border">
            <h2 className="text-xl font-bold mb-4">Music Player</h2>

            <div className="flex gap-2">
              <Input
                placeholder="Search for music..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchMusic()}
              />
              <Button onClick={searchMusic} size="icon" disabled={isLoading}>
                <MagnifyingGlassIcon className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {currentTrack && (
            <Card className="m-4 mb-0">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={currentTrack.thumbnail || "/placeholder.svg"}
                    alt={currentTrack.title}
                    className="w-16 h-16 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{currentTrack.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
                  </div>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button onClick={togglePlayPause} size="icon" variant="outline">
                    {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
                  </Button>
                  <Button onClick={handleNext} size="icon" variant="outline">
                    <ForwardIcon className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <ScrollArea className="flex-1 p-4">
            {searchResults.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Search Results</h3>
                <div className="space-y-2">
                  {searchResults.map((track) => (
                    <Card
                      key={track.id}
                      className="hover:bg-accent transition-colors cursor-pointer"
                      onContextMenu={(e) => handleContextMenu(e, track, "search")}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={track.thumbnail || "/placeholder.svg"}
                            alt={track.title}
                            className="w-12 h-12 rounded object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{track.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                          </div>
                          <Button onClick={() => addToQueue(track)} size="icon" variant="ghost">
                            <PlusIcon className="h-5 w-5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {queue.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Queue ({queue.length})</h3>
                <div className="space-y-2">
                  {queue.map((track, index) => (
                    <Card
                      key={track.queueId}
                      className={`hover:bg-accent transition-colors cursor-pointer ${
                        currentTrack?.queueId === track.queueId ? "border-primary" : ""
                      }`}
                      onContextMenu={(e) => handleContextMenu(e, track, "queue")}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
                          <img
                            src={track.thumbnail || "/placeholder.svg"}
                            alt={track.title}
                            className="w-10 h-10 rounded object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{track.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                          </div>
                          <div className="flex gap-1">
                            {currentTrack?.queueId !== track.queueId && (
                              <Button onClick={() => playTrack(track)} size="icon" variant="ghost" className="h-8 w-8">
                                <PlayIcon className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              onClick={() => removeFromQueue(track.queueId)}
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {searchResults.length === 0 && queue.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                <p>Search for music to get started!</p>
              </div>
            )}
          </ScrollArea>
        </div>

        <div id="youtube-player" style={{ width: 0, height: 0, overflow: "hidden" }} />
      </div>

      {contextMenu && (
        <div
          className="fixed bg-background border border-border rounded-md shadow-lg py-1 z-50 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-4 py-2 text-sm text-left hover:bg-accent flex items-center gap-2"
            onClick={() => {
              playNow(contextMenu.track)
              setContextMenu(null)
            }}
          >
            <PlayIcon className="h-4 w-4" />
            Play Now
          </button>

          {contextMenu.type === "search" && (
            <button
              className="w-full px-4 py-2 text-sm text-left hover:bg-accent flex items-center gap-2"
              onClick={() => {
                addToQueue(contextMenu.track as Track)
                setContextMenu(null)
              }}
            >
              <PlusIcon className="h-4 w-4" />
              Add to Queue
            </button>
          )}

          <button
            className="w-full px-4 py-2 text-sm text-left hover:bg-accent flex items-center gap-2"
            onClick={() => {
              shuffleQueue()
              setContextMenu(null)
            }}
          >
            <ArrowPathIcon className="h-4 w-4" />
            Shuffle Queue
          </button>
        </div>
      )}
    </>
  )
}

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}
