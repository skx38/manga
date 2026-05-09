'use client';

import { useState } from 'react';
import { User, BookOpen, Shield, Bell, Database } from 'lucide-react';
import GeneralSettings from '@/components/settings/GeneralSettings';
import ReaderSettingsTab from '@/components/settings/ReaderSettingsTab';
import PrivacySettings from '@/components/settings/PrivacySettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import ImportExportSettings from '@/components/settings/ImportExportSettings';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('general');

    const tabs = [
        { id: 'general', label: 'General', icon: User },
        { id: 'reader', label: 'Reader', icon: BookOpen },
        { id: 'privacy', label: 'Privacy', icon: Shield },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'data', label: 'Data & Storage', icon: Database },
    ];

    return (
        <div className="min-h-screen bg-black pb-20">
            <div className="container mx-auto px-4 py-8 max-w-5xl">
                <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Navigation */}
                    <div className="w-full md:w-64 shrink-0">
                        <div className="bg-gray-900 rounded-xl p-2 border border-gray-800 sticky top-24">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                        }`}
                                >
                                    <tab.icon size={18} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1">
                        <div className="animate-fade-in">
                            {activeTab === 'general' && <GeneralSettings />}
                            {activeTab === 'reader' && <ReaderSettingsTab />}
                            {activeTab === 'privacy' && <PrivacySettings />}
                            {activeTab === 'notifications' && <NotificationSettings />}
                            {activeTab === 'data' && <ImportExportSettings />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
