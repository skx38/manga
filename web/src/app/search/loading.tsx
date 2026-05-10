export default function SearchLoading() {
    return (
        <div className="min-h-screen flex gap-6 p-6">
            {/* Filter panel skeleton */}
            <div className="w-64 flex-shrink-0 space-y-3 hidden md:block">
                <div className="h-8 bg-muted rounded animate-pulse" />
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />
                ))}
            </div>
            {/* Results grid skeleton */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 15 }).map((_, i) => (
                    <div key={i} className="aspect-cover rounded-lg bg-muted animate-pulse" />
                ))}
            </div>
        </div>
    );
}
