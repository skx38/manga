'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronRight, Loader2, Search } from 'lucide-react';

const GENRES = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy',
    'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life',
    'Sports', 'Supernatural', 'Thriller', 'Isekai', 'Psychological'
];

const POPULAR_MANGA = [
    { id: '1', title: 'Solo Leveling', cover: '/covers/solo-leveling.jpg' },
    { id: '2', title: 'One Piece', cover: '/covers/one-piece.jpg' },
    { id: '3', title: 'Berserk', cover: '/covers/berserk.jpg' },
    { id: '4', title: 'Chainsaw Man', cover: '/covers/chainsaw-man.jpg' },
    { id: '5', title: 'Oshi no Ko', cover: '/covers/oshi-no-ko.jpg' },
];

export default function TasteTestWizard() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [selectedManga, setSelectedManga] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const toggleGenre = (genre: string) => {
        if (selectedGenres.includes(genre)) {
            setSelectedGenres(selectedGenres.filter(g => g !== genre));
        } else {
            if (selectedGenres.length < 3) {
                setSelectedGenres([...selectedGenres, genre]);
            }
        }
    };

    const toggleManga = (id: string) => {
        if (selectedManga.includes(id)) {
            setSelectedManga(selectedManga.filter(m => m !== id));
        } else {
            if (selectedManga.length < 1) { // "Pick 1 Manga"
                setSelectedManga([...selectedManga, id]);
            }
        }
    };

    const handleFinish = async () => {
        setLoading(true);
        // Simulate API call to save preferences and generate feed
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Save to DB (mock)
        // await fetch('/api/user/preferences', ...);

        setLoading(false);
        router.push('/'); // Redirect to Home
    };

    return (
        <div className="max-w-2xl mx-auto bg-gray-900 rounded-2xl border border-gray-800 p-8 shadow-2xl">
            {/* Progress Bar */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex gap-2">
                    {[1, 2, 3].map(i => (
                        <div
                            key={i}
                            className={`h-2 w-12 rounded-full transition-colors ${step >= i ? 'bg-blue-600' : 'bg-gray-800'
                                }`}
                        />
                    ))}
                </div>
                <span className="text-gray-500 text-sm font-bold">Step {step} of 3</span>
            </div>

            {/* Step 1: Genres */}
            {step === 1 && (
                <div className="animate-fade-in">
                    <h2 className="text-3xl font-bold text-white mb-2">What do you like?</h2>
                    <p className="text-gray-400 mb-6">Pick at least 3 genres to help us recommend comics.</p>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-8">
                        {GENRES.map(genre => (
                            <button
                                key={genre}
                                onClick={() => toggleGenre(genre)}
                                className={`p-3 rounded-xl text-sm font-bold transition-all border ${selectedGenres.includes(genre)
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-900/50 scale-105'
                                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:bg-gray-750'
                                    }`}
                            >
                                {genre}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setStep(2)}
                        disabled={selectedGenres.length < 3}
                        className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        Next Step <ChevronRight size={20} />
                    </button>
                </div>
            )}

            {/* Step 2: Manga */}
            {step === 2 && (
                <div className="animate-fade-in">
                    <h2 className="text-3xl font-bold text-white mb-2">Have you read these?</h2>
                    <p className="text-gray-400 mb-6">Pick 1 manga you've enjoyed before.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        {POPULAR_MANGA.map(manga => (
                            <button
                                key={manga.id}
                                onClick={() => toggleManga(manga.id)}
                                className={`flex items-center gap-4 p-3 rounded-xl border text-left transition-all ${selectedManga.includes(manga.id)
                                        ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500'
                                        : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                                    }`}
                            >
                                <div className="w-12 h-16 bg-gray-700 rounded-md shrink-0 overflow-hidden">
                                    {/* Placeholder for cover */}
                                    <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-600" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold">{manga.title}</h3>
                                    <span className="text-xs text-gray-400">Popular Choice</span>
                                </div>
                                {selectedManga.includes(manga.id) && (
                                    <div className="ml-auto bg-blue-500 rounded-full p-1">
                                        <Check size={12} className="text-white" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setStep(1)}
                            className="px-6 py-4 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition-colors"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => setStep(3)}
                            disabled={selectedManga.length < 1}
                            className="flex-1 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            Next Step <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Generating */}
            {step === 3 && (
                <div className="animate-fade-in text-center py-12">
                    {!loading ? (
                        <>
                            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-900/50 animate-pulse">
                                <Search size={40} className="text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-4">Building your feed...</h2>
                            <p className="text-gray-400 mb-8 max-w-md mx-auto">
                                We're analyzing your taste to find the perfect comics for you to start reading.
                            </p>
                            <button
                                onClick={handleFinish}
                                className="px-12 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                            >
                                Let's Go! 🚀
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center">
                            <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
                            <p className="text-gray-400">Finalizing setup...</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
