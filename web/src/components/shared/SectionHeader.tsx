import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
    title: string;
    icon?: LucideIcon;
    href?: string;
    viewAllLabel?: string;
}

export function SectionHeader({ title, icon: Icon, href, viewAllLabel = 'View all' }: SectionHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-5">
            <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
                {Icon && <Icon className="h-5 w-5 text-brand" aria-hidden />}
                {title}
            </h2>
            {href && (
                <Link
                    href={href}
                    className="text-sm font-medium text-muted-foreground hover:text-brand transition-colors"
                >
                    {viewAllLabel} →
                </Link>
            )}
        </div>
    );
}
