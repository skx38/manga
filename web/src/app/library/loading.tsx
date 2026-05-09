export default function LibraryLoading() {
    return (
        <div className="flex min-h-screen">
            {/* Sidebar skeleton */}
            <div className="w-64 border-r border-border p-4 hidden md:block space-y-3">
                <div className="h-7 bg-muted rounded animate-pulse w-24 mb-6" />
                {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />
                ))}
            </div>
            {/* Main content skeleton */}
            <div className="flex-1 p-6">
                <div className="h-8 bg-muted rounded animate-pulse w-48 mb-6" />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="aspect-cover rounded-lg bg-muted animate-pulse" />
                    ))}
                </div>
            </div>
        </div>
    );
}
