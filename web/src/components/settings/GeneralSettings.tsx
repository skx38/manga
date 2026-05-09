'use client';

import { useState } from 'react';
import { Camera, Save } from 'lucide-react';

export default function GeneralSettings() {
    const [bio, setBio] = useState('Just a manga enthusiast navigating the multiverse.');
    const [username, setUsername] = useState('omniread_user');

    return (
        <div className="space-y-8">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h2 className="text-xl font-bold mb-6">Profile Identity</h2>

                {/* Avatar & Banner */}
                <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Avatar & Banner</label>
                    <div className="flex items-center gap-6">
                        <div className="relative group cursor-pointer">
                            <div className="w-24 h-24 rounded-full bg-gray-700 border-2 border-gray-600 overflow-hidden">
                                {/* <Image ... /> */}
                                <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                            </div>
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={20} className="text-white" />
                            </div>
                        </div>
                        <div className="flex-1 h-24 bg-gray-800 rounded-xl border border-gray-700 relative group cursor-pointer overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-purple-900" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white font-bold flex items-center gap-2"><Camera size={16} /> Change Banner</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fields */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={4}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-1 text-right">{bio.length}/160</p>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2">
                        <Save size={18} />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
