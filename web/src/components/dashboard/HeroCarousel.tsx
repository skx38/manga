'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroComic {
    id: string;
    title: string;
    coverUrl: string;
    description?: string;
}

interface HeroCarouselProps {
    comics: HeroComic[];
}

export default function HeroCarousel({ comics }: HeroCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (comics.length === 0) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % comics.length);
        }, 5000); // Cycle every 5 seconds

        return () => clearInterval(interval);
    }, [comics.length]);

    if (comics.length === 0) return null;

    const currentComic = comics[currentIndex];

    const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % comics.length);
    const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + comics.length) % comics.length);

    return (
        <div className="relative h-[50vh] md:h-[60vh] w-full overflow-hidden group bg-[#0a0c10]">
            {/* Background Image with Fade Transition */}
            {comics.map((comic, index) => (
                <div
                    key={comic.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ${index === currentIndex ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0a0c10]/30 via-[#0a0c10]/60 to-[#0a0c10] z-10" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0a0c10]/80 via-[#0a0c10]/40 to-transparent z-10" />
                    <Image
                        src={comic.coverUrl}
                        alt={comic.title}
                        fill
                        className="object-cover object-center opacity-50 blur-xl scale-110"
                        priority={index === 0}
                    />
                </div>
            ))}

            {/* Content */}
            <div className="absolute inset-0 z-20 container mx-auto px-8 flex items-center justify-between">
                <div className="max-w-2xl animate-fade-in flex flex-col justify-center h-full pb-12 md:pb-0">
                    <div>
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold mb-4 inline-block shadow-lg">
                            Trending Now
                        </span>
                        <Link href={`/comic/${currentComic.id}`} className="block w-fit group/title">
                            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 drop-shadow-lg line-clamp-2 group-hover/title:text-blue-400 transition-colors">
                                {currentComic.title}
                            </h1>
                        </Link>
                        <p className="text-gray-200 text-lg mb-8 line-clamp-2 drop-shadow-md max-w-xl">
                            {currentComic.description || "Discover the most popular comics on OmniRead right now. Join thousands of readers diving into these epic stories."}
                        </p>

                        <div className="flex gap-4">
                            <Link
                                href={`/comic/${currentComic.id}`}
                                className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-xl"
                            >
                                <BookOpen size={20} />
                                Start Reading
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Floating Cover Image (Desktop Only) */}
                <Link
                    href={`/comic/${currentComic.id}`}
                    className="hidden md:block relative h-[350px] w-[240px] lg:h-[450px] lg:w-[300px] flex-shrink-0 mr-8 animate-fade-in cursor-pointer"
                >
                    <div className="absolute inset-0 bg-white/10 rotate-3 rounded-lg backdrop-blur-sm transform transition-transform duration-500 group-hover:rotate-6" />
                    <Image
                        src={currentComic.coverUrl}
                        alt={currentComic.title}
                        fill
                        className="object-cover rounded-lg shadow-2xl rotate-0 transform transition-transform duration-500 group-hover:-rotate-2 ring-1 ring-white/20"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority
                    />
                </Link>
            </div>

            {/* Navigation Buttons (Visible on Hover) */}
            <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 backdrop-blur-sm"
            >
                <ChevronLeft size={24} />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 backdrop-blur-sm"
            >
                <ChevronRight size={24} />
            </button>

            {/* Indicators */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                {comics.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`h-1.5 rounded-full transition-all ${index === currentIndex ? 'bg-white w-8' : 'bg-white/30 w-4 hover:bg-white/50'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
