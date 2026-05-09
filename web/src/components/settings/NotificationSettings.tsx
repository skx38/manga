'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';

export default function NotificationSettings() {
    const [newChapters, setNewChapters] = useState(true);
    const [replies, setReplies] = useState(true);
    const [trending, setTrending] = useState(false);

    const Toggle = ({ label, desc, checked, onChange }: any) => (
        <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div>
                <div className="font-bold text-white mb-1">{label}</div>
                <div className="text-xs text-gray-400">{desc}</div>
            </div>
            <button
                onClick={onChange}
                className={`w-12 h-6 rounded-full transition-colors relative ${checked ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
            >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'left-7' : 'left-1'
                    }`} />
            </button>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Bell size={20} />
                    Notification Preferences
                </h2>

                <div className="space-y-4">
                    <Toggle
                        label="New Chapter Releases"
                        desc="Get notified when comics in your library update."
                        checked={newChapters}
                        onChange={() => setNewChapters(!newChapters)}
                    />
                    <Toggle
                        label="Replies & Mentions"
                        desc="When someone replies to your comments."
                        checked={replies}
                        onChange={() => setReplies(!replies)}
                    />
                    <Toggle
                        label="Trending Posts"
                        desc="Daily digest of popular community discussions."
                        checked={trending}
                        onChange={() => setTrending(!trending)}
                    />
                </div>
            </div>
        </div>
    );
}
