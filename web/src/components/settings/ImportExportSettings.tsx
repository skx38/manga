'use client';

import { useState } from 'react';
import { Upload, Download, FileJson, AlertTriangle, Check, Loader2, User } from 'lucide-react';

type ImportSource = 'mal' | 'anilist' | 'tachiyomi' | 'mihon' | 'comick';
type ImportMode = 'merge' | 'replace';
type ImportMethod = 'file' | 'username';

export default function ImportExportSettings() {
    const [method, setMethod] = useState<ImportMethod>('file');
    const [source, setSource] = useState<ImportSource>('mal');
    const [mode, setMode] = useState<ImportMode>('merge');
    const [username, setUsername] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleImport = async () => {
        if (method === 'file' && !file) return;
        if (method === 'username' && !username) return;

        if (mode === 'replace') {
            if (!confirm('WARNING: This will DELETE your entire library and replace it with the imported data. Are you sure?')) {
                return;
            }
        }

        setLoading(true);
        setStatus(null);
        setLogs([]);

        try {
            let res;
            if (method === 'file' && file) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('source', source);
                formData.append('mode', mode);

                res = await fetch('/api/library/import/file', {
                    method: 'POST',
                    body: formData,
                });
            } else {
                res = await fetch('/api/library/import/username', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, source, mode }),
                });
            }

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Import failed');

            setStatus({ type: 'success', message: `Import successful! Processed ${data.processed} entries.` });
            if (data.logs) setLogs(data.logs);
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const res = await fetch('/api/library/export');
            if (!res.ok) throw new Error('Export failed');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `omniread-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error(error);
            alert('Failed to export library');
        }
    };

    return (
        <div className="space-y-8">
            {/* Import Section */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Upload size={20} />
                    Import Library
                </h2>

                <div className="space-y-6">
                    {/* Method Selection */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => setMethod('file')}
                            className={`flex-1 py-2 px-4 rounded-lg border text-sm font-bold transition-colors flex items-center justify-center gap-2 ${method === 'file'
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                                }`}
                        >
                            <FileJson size={16} />
                            File Upload
                        </button>
                        <button
                            onClick={() => setMethod('username')}
                            className={`flex-1 py-2 px-4 rounded-lg border text-sm font-bold transition-colors flex items-center justify-center gap-2 ${method === 'username'
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                                }`}
                        >
                            <User size={16} />
                            Username
                        </button>
                    </div>

                    {/* Source Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Source</label>
                        <select
                            value={source}
                            onChange={(e) => setSource(e.target.value as ImportSource)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                            <option value="mal">MyAnimeList (MAL)</option>
                            <option value="anilist">Anilist</option>
                            {method === 'file' && <option value="tachiyomi">Tachiyomi (JSON backup)</option>}
                            {method === 'file' && <option value="mihon">Mihon / Tachiyomi (protobuf .proto.gz)</option>}
                            {method === 'file' && <option value="comick">Comick</option>}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                            {method === 'file'
                                ? source === 'mal'
                                    ? 'Upload your XML export from MyAnimeList.'
                                    : source === 'tachiyomi'
                                    ? 'Upload your JSON backup from Tachiyomi (legacy format).'
                                    : source === 'mihon'
                                    ? 'Upload your .proto.gz backup from Mihon or modern Tachiyomi. Preserves read progress and category-based status.'
                                    : 'Upload your JSON export file.'
                                : 'Enter your public username.'
                            }
                        </p>
                    </div>

                    {/* Input Area */}
                    {method === 'file' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">File</label>
                            <input
                                type="file"
                                accept=".json,.xml,.proto,.proto.gz,.gz"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-400
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-gray-800 file:text-blue-400
                                    hover:file:bg-gray-700
                                "
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="e.g. omniread_user"
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                    )}

                    {/* Mode Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Import Mode</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setMode('merge')}
                                className={`p-3 rounded-lg border text-left transition-all ${mode === 'merge'
                                    ? 'bg-blue-600/20 border-blue-600'
                                    : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                                    }`}
                            >
                                <div className="font-bold text-sm mb-1 text-white">Merge</div>
                                <div className="text-xs text-gray-400">Adds new comics and updates existing ones. Safe.</div>
                            </button>
                            <button
                                onClick={() => setMode('replace')}
                                className={`p-3 rounded-lg border text-left transition-all ${mode === 'replace'
                                    ? 'bg-red-600/20 border-red-600'
                                    : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                                    }`}
                            >
                                <div className="font-bold text-sm mb-1 text-white flex items-center gap-1">
                                    <AlertTriangle size={12} className="text-red-500" />
                                    Replace
                                </div>
                                <div className="text-xs text-gray-400">Wipes library first. Destructive.</div>
                            </button>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={handleImport}
                        disabled={loading || (method === 'file' && !file) || (method === 'username' && !username)}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                        {loading ? 'Importing...' : 'Start Import'}
                    </button>

                    {/* Status Messages */}
                    {status && (
                        <div className={`p-4 rounded-lg flex items-start gap-3 ${status.type === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                            }`}>
                            {status.type === 'success' ? <Check size={20} /> : <AlertTriangle size={20} />}
                            <div>
                                <p className="font-bold">{status.type === 'success' ? 'Success' : 'Error'}</p>
                                <p className="text-sm">{status.message}</p>
                            </div>
                        </div>
                    )}

                    {/* Logs */}
                    {logs.length > 0 && (
                        <div className="bg-black/50 rounded-lg p-4 font-mono text-xs text-gray-400 max-h-40 overflow-y-auto">
                            {logs.map((log, i) => (
                                <div key={i}>{log}</div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Export Section */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Download size={20} />
                    Export Library
                </h2>
                <p className="text-gray-400 text-sm mb-6">
                    Download a JSON backup of your entire library, including reading progress and folders.
                </p>
                <button
                    onClick={handleExport}
                    className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg border border-gray-700 transition-colors flex items-center gap-2"
                >
                    <Download size={18} />
                    Export to JSON
                </button>
            </div>
        </div>
    );
}
