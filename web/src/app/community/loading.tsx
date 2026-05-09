export default function CommunityLoading() {
    return (
        <div className="min-h-screen max-w-5xl mx-auto px-4 py-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl overflow-hidden flex animate-pulse">
                    {/* Vote column */}
                    <div className="w-12 bg-muted/30 border-r border-border" />
                    {/* Content */}
                    <div className="flex-1 p-4 space-y-3">
                        <div className="flex gap-2">
                            <div className="h-3 bg-muted rounded w-24" />
                            <div className="h-3 bg-muted rounded w-16" />
                        </div>
                        <div className="h-5 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-full" />
                        <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}
