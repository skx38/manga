export default function Loading() {
    return (
        <div className="min-h-screen p-6 space-y-8">
            {/* Hero skeleton */}
            <div className="h-64 rounded-xl bg-muted animate-pulse" />
            {/* Grid skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="aspect-cover rounded-lg bg-muted animate-pulse" />
                ))}
            </div>
        </div>
    );
}
