export interface Track {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string
  videoId: string
}

export interface QueueItem extends Track {
  queueId: string
  addedAt: number
}
