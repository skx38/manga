'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <AlertTriangle size={48} className="text-destructive mx-auto mb-4" />
                <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
                <p className="text-muted-foreground text-sm mb-6">
                    {error.message || 'An unexpected error occurred. Please try again.'}
                </p>
                <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 bg-brand text-brand-foreground hover:bg-brand/90 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    <RefreshCw size={16} />
                    Try again
                </button>
            </div>
        </div>
    );
}
