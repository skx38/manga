'use client';

import { useReaderStore } from '@/store/readerStore';
import { Settings, AlignJustify, BookOpen, ArrowRight, ArrowLeft, ArrowDown, Maximize, Minimize } from 'lucide-react';

export default function ReaderSettings() {
    const {
        readingMode, setReadingMode,
        direction, setDirection,
        fitMode, setFitMode,
        doublePage, setDoublePage,
        theme, setTheme,
        einkMode, setEinkMode,
        danmuEnabled, setDanmuEnabled,
    } = useReaderStore();

    return (
        <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-800 rounded-lg p-4 w-72 shadow-xl text-white">
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                <Settings size={14} />
                Reader Settings
            </h3>

            {/* Reading Mode */}
            <div className="mb-6">
                <label className="text-xs text-gray-500 mb-2 block">Reading Mode</label>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => setReadingMode('STRIP')}
                        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${readingMode === 'STRIP'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        <ArrowDown size={16} />
                        Webtoon
                    </button>
                    <button
                        onClick={() => setReadingMode('PAGE')}
                        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${readingMode === 'PAGE'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        <BookOpen size={16} />
                        Page
                    </button>
                </div>
            </div>

            {/* Direction (Only for Page Mode) */}
            {readingMode === 'PAGE' && (
                <div className="mb-6">
                    <label className="text-xs text-gray-500 mb-2 block">Direction</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setDirection('LTR')}
                            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${direction === 'LTR'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            <ArrowRight size={16} />
                            Left to Right
                        </button>
                        <button
                            onClick={() => setDirection('RTL')}
                            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${direction === 'RTL'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            <ArrowLeft size={16} />
                            Right to Left
                        </button>
                    </div>
                </div>
            )}

            {/* Double Page (Only for Page Mode) */}
            {readingMode === 'PAGE' && (
                <div className="mb-6">
                    <label className="text-xs text-gray-500 mb-2 block">Layout</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setDoublePage(false)}
                            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${!doublePage
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            <Minimize size={16} />
                            Single
                        </button>
                        <button
                            onClick={() => setDoublePage(true)}
                            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${doublePage
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            <BookOpen size={16} />
                            Double
                        </button>
                    </div>
                </div>
            )}

            {/* Fit Mode */}
            <div className="mb-6">
                <label className="text-xs text-gray-500 mb-2 block">Fit Mode</label>
                <div className="grid grid-cols-3 gap-2">
                    <button
                        onClick={() => setFitMode('WIDTH')}
                        className={`flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-md text-xs transition-colors ${fitMode === 'WIDTH'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        <Maximize size={14} className="rotate-90" />
                        Width
                    </button>
                    <button
                        onClick={() => setFitMode('HEIGHT')}
                        className={`flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-md text-xs transition-colors ${fitMode === 'HEIGHT'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        <Maximize size={14} />
                        Height
                    </button>
                    <button
                        onClick={() => setFitMode('ORIGINAL')}
                        className={`flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-md text-xs transition-colors ${fitMode === 'ORIGINAL'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        <Minimize size={14} />
                        Original
                    </button>
                </div>
            </div>

            {/* Theme */}
            <div className="mb-6">
                <label className="text-xs text-gray-500 mb-2 block">Theme</label>
                <div className="grid grid-cols-3 gap-2">
                    <button
                        onClick={() => setTheme('LIGHT')}
                        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${theme === 'LIGHT'
                            ? 'bg-white text-black border border-gray-300'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        Light
                    </button>
                    <button
                        onClick={() => setTheme('DARK')}
                        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${theme === 'DARK'
                            ? 'bg-gray-700 text-white border border-gray-600'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        Dark
                    </button>
                    <button
                        onClick={() => setTheme('BLACK')}
                        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${theme === 'BLACK'
                            ? 'bg-black text-white border border-gray-700'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        Black
                    </button>
                </div>
            </div>

            {/* E-Ink Mode */}
            <div className="mb-2">
                <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-gray-500">E-Ink Mode</span>
                    <button
                        role="switch"
                        aria-checked={einkMode}
                        onClick={() => setEinkMode(!einkMode)}
                        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none ${einkMode ? 'bg-blue-600' : 'bg-gray-700'}`}
                    >
                        <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transition-transform ${einkMode ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                </label>
                <p className="text-[10px] text-gray-600 mt-1">Grayscale + no animations for e-ink devices.</p>
            </div>

            {/* Danmu */}
            <div className="mb-2 mt-4">
                <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-gray-500">Danmu (Bullet Comments)</span>
                    <button
                        role="switch"
                        aria-checked={danmuEnabled}
                        onClick={() => setDanmuEnabled(!danmuEnabled)}
                        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none ${danmuEnabled ? 'bg-blue-600' : 'bg-gray-700'}`}
                    >
                        <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transition-transform ${danmuEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                </label>
                <p className="text-[10px] text-gray-600 mt-1">Live scrolling comments overlaid on the page.</p>
            </div>

        </div>
    );
}
