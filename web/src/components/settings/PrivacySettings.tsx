'use client';

import { useState } from 'react';
import { Eye, Shield, Lock } from 'lucide-react';

export default function PrivacySettings() {
    const [visibility, setVisibility] = useState('public');
    const [adultContent, setAdultContent] = useState('blur');
    const [spoilers, setSpoilers] = useState(true);

    return (
        <div className="space-y-8">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Shield size={20} />
                    Privacy & Safety
                </h2>

                <div className="space-y-6">
                    {/* Library Visibility */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-3">Library Visibility</label>
                        <select
                            value={visibility}
                            onChange={(e) => setVisibility(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                            <option value="public">Public (Visible to everyone)</option>
                            <option value="friends">Friends Only</option>
                            <option value="private">Private (Only me)</option>
                        </select>
                    </div>

                    {/* Adult Content */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-3">Adult Content</label>
                        <div className="grid grid-cols-3 gap-4">
                            <button
                                onClick={() => setAdultContent('show')}
                                className={`p-3 rounded-lg border text-sm font-bold transition-all ${adultContent === 'show'
                                        ? 'bg-red-600 border-red-600 text-white'
                                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                                    }`}
                            >
                                Show All
                            </button>
                            <button
                                onClick={() => setAdultContent('blur')}
                                className={`p-3 rounded-lg border text-sm font-bold transition-all ${adultContent === 'blur'
                                        ? 'bg-yellow-600 border-yellow-600 text-white'
                                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                                    }`}
                            >
                                Blur Covers
                            </button>
                            <button
                                onClick={() => setAdultContent('hide')}
                                className={`p-3 rounded-lg border text-sm font-bold transition-all ${adultContent === 'hide'
                                        ? 'bg-green-600 border-green-600 text-white'
                                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                                    }`}
                            >
                                Hide 18+
                            </button>
                        </div>
                    </div>

                    {/* Spoiler Protection */}
                    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
                        <div>
                            <div className="font-bold text-white mb-1">Spoiler Protection</div>
                            <div className="text-xs text-gray-400">Blur comments and posts marked as spoilers.</div>
                        </div>
                        <button
                            onClick={() => setSpoilers(!spoilers)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${spoilers ? 'bg-blue-600' : 'bg-gray-600'
                                }`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${spoilers ? 'left-7' : 'left-1'
                                }`} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
