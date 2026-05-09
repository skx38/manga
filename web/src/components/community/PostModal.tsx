'use client';

import { X } from 'lucide-react';
import PostThread from './PostThread';

interface PostModalProps {
    isOpen: boolean;
    onClose: () => void;
    postId: string;
}

export default function PostModal({ isOpen, onClose, postId }: PostModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div
                className="absolute inset-0"
                onClick={onClose}
            />
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 rounded-xl shadow-2xl border border-gray-800 animate-scale-in custom-scrollbar">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-gray-800/80 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                >
                    <X size={20} />
                </button>
                <PostThread postId={postId} />
            </div>
        </div>
    );
}
