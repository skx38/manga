'use client';

import { useState } from 'react';
import { BookOpen, Monitor, Wifi } from 'lucide-react';

export default function ReaderSettingsTab() {
    const [direction, setDirection] = useState('ltr');
    const [quality, setQuality] = useState('high');
    const [preload, setPreload] = useState(true);

    return (
        <div className="space-y-8">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <BookOpen size={20} />
                    Global Reading Preferences
                </h2>

                <div className="space-y-6">
                    {/* Direction */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-3">Default Reading Direction</label>
                        <div className="grid grid-cols-3 gap-4">
                            {['ltr', 'rtl', 'vertical'].map((dir) => (
                                <button
                                    key={dir}
                                    onClick={() => setDirection(dir)}
                                    className={`p-3 rounded-lg border text-sm font-bold transition-all ${direction === dir
                                            ? 'bg-blue-600 border-blue-600 text-white'
                                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                                        }`}
                                >
                                    {dir === 'ltr' ? 'Left to Right' : dir === 'rtl' ? 'Right to Left' : 'Vertical (Webtoon)'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quality */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-3">Image Quality</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setQuality('high')}
                                className={`p-3 rounded-lg border text-left transition-all ${quality === 'high'
                                        ? 'bg-blue-600/20 border-blue-600'
                                        : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                                    }`}
                            >
                                <div className="font-bold text-white mb-1">High Definition</div>
                                <div className="text-xs text-gray-400">Original quality. Higher data usage.</div>
                            </button>
                            <button
                                onClick={() => setQuality('saver')}
                                className={`p-3 rounded-lg border text-left transition-all ${quality === 'saver'
                                        ? 'bg-green-600/20 border-green-600'
                                        : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                                    }`}
                            >
                                <div className="font-bold text-white mb-1">Data Saver</div>
                                <div className="text-xs text-gray-400">Compressed images. Faster loading.</div>
                            </button>
                        </div>
                    </div>

                    {/* Preload */}
                    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
                        <div>
                            <div className="font-bold text-white mb-1">Pre-load Next Chapter</div>
                            <div className="text-xs text-gray-400">Automatically load the next chapter while reading.</div>
                        </div>
                        <button
                            onClick={() => setPreload(!preload)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${preload ? 'bg-blue-600' : 'bg-gray-600'
                                }`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${preload ? 'left-7' : 'left-1'
                                }`} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
