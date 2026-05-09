import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ReadingMode = 'STRIP' | 'PAGE';
export type ReadingDirection = 'LTR' | 'RTL' | 'VERTICAL';
export type FitMode = 'WIDTH' | 'HEIGHT' | 'ORIGINAL';
export type Theme = 'LIGHT' | 'DARK' | 'BLACK';

interface ReaderState {
    // Settings
    readingMode: ReadingMode;
    direction: ReadingDirection;
    fitMode: FitMode;
    zoom: number;
    showOverlay: boolean;
    doublePage: boolean;
    theme: Theme;

    // Actions
    setReadingMode: (mode: ReadingMode) => void;
    setDirection: (direction: ReadingDirection) => void;
    setFitMode: (mode: FitMode) => void;
    setZoom: (zoom: number) => void;
    toggleOverlay: () => void;
    setShowOverlay: (show: boolean) => void;
    setDoublePage: (double: boolean) => void;
    setTheme: (theme: Theme) => void;
}

export const useReaderStore = create<ReaderState>()(
    persist(
        (set) => ({
            readingMode: 'STRIP', // Default to Webtoon style
            direction: 'LTR',
            fitMode: 'HEIGHT',
            zoom: 100,
            showOverlay: true,
            doublePage: false,
            theme: 'BLACK',

            setReadingMode: (mode) => set({ readingMode: mode }),
            setDirection: (direction) => set({ direction }),
            setFitMode: (fitMode) => set({ fitMode }),
            setZoom: (zoom) => set({ zoom }),
            toggleOverlay: () => set((state) => ({ showOverlay: !state.showOverlay })),
            setShowOverlay: (show) => set({ showOverlay: show }),
            setDoublePage: (doublePage) => set({ doublePage }),
            setTheme: (theme) => set({ theme }),
        }),
        {
            name: 'reader-storage',
            partialize: (state) => ({
                readingMode: state.readingMode,
                direction: state.direction,
                fitMode: state.fitMode,
                zoom: state.zoom,
                doublePage: state.doublePage,
                theme: state.theme
            }), // Only persist settings, not UI state like overlay
        }
    )
);
