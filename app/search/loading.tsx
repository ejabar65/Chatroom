export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-6">
          {/* Search bar skeleton */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="h-10 bg-muted rounded animate-pulse mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="h-10 bg-muted rounded animate-pulse" />
              <div className="h-10 bg-muted rounded animate-pulse" />
              <div className="h-10 bg-muted rounded animate-pulse" />
              <div className="h-10 bg-muted rounded animate-pulse" />
            </div>
          </div>

          {/* Results skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-lg border border-border p-6">
                <div className="h-6 bg-muted rounded animate-pulse mb-2 w-3/4" />
                <div className="h-4 bg-muted rounded animate-pulse mb-4 w-full" />
                <div className="flex gap-4">
                  <div className="h-4 bg-muted rounded animate-pulse w-20" />
                  <div className="h-4 bg-muted rounded animate-pulse w-20" />
                  <div className="h-4 bg-muted rounded animate-pulse w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
