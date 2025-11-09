import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
  }

  try {
    // Using YouTube Data API v3
    const apiKey = process.env.YOUTUBE_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "YouTube API key not configured" }, { status: 500 })
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        query + " music",
      )}&type=video&videoCategoryId=10&maxResults=10&key=${apiKey}`,
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || "Failed to search" }, { status: response.status })
    }

    const tracks = data.items.map((item: any) => ({
      id: item.id.videoId,
      videoId: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium.url,
      duration: "Unknown",
    }))

    return NextResponse.json({ tracks })
  } catch (error) {
    console.error("[v0] Music search error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
