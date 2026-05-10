'use client';

import { useState } from 'react';
import { Eye, EyeOff, ExternalLink } from 'lucide-react';
import TenorEmbed from './TenorEmbed';

interface RichTextParserProps {
    content: string;
}

export default function RichTextParser({ content }: RichTextParserProps) {
    // Regex for spoilers: >!text!<
    const spoilerRegex = />!((?:.|\n)*?)!</g;

    const tokens: { type: 'text' | 'spoiler'; content: string }[] = [];
    let currentIndex = 0;
    let match;

    while ((match = spoilerRegex.exec(content)) !== null) {
        if (match.index > currentIndex) {
            tokens.push({ type: 'text', content: content.slice(currentIndex, match.index) });
        }
        tokens.push({ type: 'spoiler', content: match[1] });
        currentIndex = spoilerRegex.lastIndex;
    }
    if (currentIndex < content.length) {
        tokens.push({ type: 'text', content: content.slice(currentIndex) });
    }

    return (
        <div className="whitespace-pre-wrap break-words">
            {tokens.map((token, index) => {
                if (token.type === 'spoiler') {
                    return <SpoilerBlock key={index} content={token.content} />;
                } else {
                    return <TextBlock key={index} content={token.content} />;
                }
            })}
        </div>
    );
}

function SpoilerBlock({ content }: { content: string }) {
    const [isRevealed, setIsRevealed] = useState(false);

    return (
        <span
            className={`inline-block rounded px-1 transition-colors cursor-pointer align-middle ${isRevealed
                ? 'bg-gray-800 text-gray-200 border border-gray-700'
                : 'bg-black text-transparent select-none hover:bg-gray-900'
                }`}
            onClick={(e) => {
                e.stopPropagation();
                setIsRevealed(!isRevealed);
            }}
            title={isRevealed ? "Click to hide spoiler" : "Click to reveal spoiler"}
        >
            {isRevealed ? (
                <TextBlock content={content} />
            ) : (
                <span className="opacity-0">{content}</span>
            )}
        </span>
    );
}

function TextBlock({ content }: { content: string }) {
    // First pass: split on @mentions so we can linkify them separately.
    const mentionRegex = /@(\w{1,32})/g;
    const preParts: (string | React.ReactNode)[] = [];
    let lastMention = 0;
    let mm: RegExpExecArray | null;

    while ((mm = mentionRegex.exec(content)) !== null) {
        if (mm.index > lastMention) {
            preParts.push(content.slice(lastMention, mm.index));
        }
        const username = mm[1];
        preParts.push(
            <a
                key={`mention-${mm.index}`}
                href={`/u/${username}`}
                className="text-brand hover:underline font-medium"
                onClick={(e) => e.stopPropagation()}
            >
                @{username}
            </a>
        );
        lastMention = mentionRegex.lastIndex;
    }
    if (lastMention < content.length) {
        preParts.push(content.slice(lastMention));
    }

    // Second pass: run URL detection only on raw string segments.
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts: (string | React.ReactNode)[] = [];

    for (const seg of preParts) {
        if (typeof seg !== 'string') {
            parts.push(seg);
            continue;
        }
        let lastIndex = 0;
        let match: RegExpExecArray | null;
        urlRegex.lastIndex = 0;

        while ((match = urlRegex.exec(seg)) !== null) {
            if (match.index > lastIndex) {
                parts.push(seg.slice(lastIndex, match.index));
            }
            const url = match[0];
            const isImage = /\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i.test(url);
            const tenorMatch = url.match(/tenor\.com\/view\/.*-(\d+)$/i);

            if (isImage) {
                parts.push(
                    <div key={`img-${match.index}`} className="my-2">
                        <img
                            src={url}
                            alt="User embedded content"
                            className="max-w-full max-h-96 rounded-lg border border-gray-800 hover:opacity-90 transition-opacity cursor-pointer"
                            onClick={() => window.open(url, '_blank')}
                            loading="lazy"
                        />
                    </div>
                );
            } else if (tenorMatch) {
                parts.push(<TenorEmbed key={`tenor-${match.index}`} id={tenorMatch[1]} />);
            } else {
                parts.push(
                    <a
                        key={`url-${match.index}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline inline-flex items-center gap-0.5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {url} <ExternalLink size={10} />
                    </a>
                );
            }
            lastIndex = urlRegex.lastIndex;
        }
        if (lastIndex < seg.length) {
            parts.push(seg.slice(lastIndex));
        }
    }

    return <>{parts}</>;
}
