export default function ReaderLoading() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
            <div className="w-full max-w-2xl space-y-2 px-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div
                        key={i}
                        className="w-full bg-muted animate-pulse rounded"
                        style={{ height: `${320 + (i % 3) * 60}px` }}
                    />
                ))}
            </div>
        </div>
    );
}
