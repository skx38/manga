import { create } from 'zustand';

export type VoteType = 'UP' | 'DOWN' | null;

interface VoteMetrics {
    upvotes: number;
    downvotes: number;
    totalVotes: number;
    upvotePercentage: number;
    isControversial: boolean;
}

interface VoteState {
    // targetId -> vote type
    votes: Map<string, VoteType>;
    // targetId -> score
    scores: Map<string, number>;
    // targetId -> metrics
    metrics: Map<string, VoteMetrics>;

    // Optimistically update vote in UI
    optimisticVote: (targetId: string, voteType: VoteType) => void;

    // Sync vote with backend
    syncVote: (targetId: string, targetType: 'POST' | 'COMMENT', voteType: VoteType) => Promise<void>;

    // Get current vote for a target
    getVote: (targetId: string) => VoteType;

    // Get current score for a target
    getScore: (targetId: string) => number;

    // Get vote metrics
    getMetrics: (targetId: string) => VoteMetrics | undefined;

    // Set initial state from server
    setVote: (targetId: string, voteType: VoteType, score: number, metrics?: VoteMetrics) => void;
}

export const useVoteStore = create<VoteState>((set, get) => ({
    votes: new Map(),
    scores: new Map(),
    metrics: new Map(),

    optimisticVote: (targetId, voteType) => {
        const currentVote = get().votes.get(targetId);
        const currentScore = get().scores.get(targetId) || 0;

        let newVote: VoteType = voteType;
        let scoreDelta = 0;

        if (currentVote === voteType) {
            // Clicking same vote - remove it
            newVote = null;
            scoreDelta = voteType === 'UP' ? -1 : 1;
        } else if (currentVote === null) {
            // New vote
            scoreDelta = voteType === 'UP' ? 1 : -1;
        } else {
            // Changing vote
            scoreDelta = voteType === 'UP' ? 2 : -2;
        }

        set((state) => {
            const newVotes = new Map(state.votes);
            const newScores = new Map(state.scores);

            newVotes.set(targetId, newVote);
            newScores.set(targetId, currentScore + scoreDelta);

            return { votes: newVotes, scores: newScores };
        });
    },

    syncVote: async (targetId, targetType, voteType) => {
        try {
            const response = await fetch('/api/votes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetId, targetType, voteType }),
            });

            if (!response.ok) {
                throw new Error('Failed to sync vote');
            }

            const data = await response.json();

            // Update with server response
            set((state) => {
                const newVotes = new Map(state.votes);
                const newScores = new Map(state.scores);
                const newMetrics = new Map(state.metrics);

                newVotes.set(targetId, data.voteType);
                newScores.set(targetId, data.score);
                newMetrics.set(targetId, {
                    upvotes: data.upvotes,
                    downvotes: data.downvotes,
                    totalVotes: data.totalVotes,
                    upvotePercentage: data.upvotePercentage,
                    isControversial: data.isControversial
                });

                return { votes: newVotes, scores: newScores, metrics: newMetrics };
            });
        } catch (error) {
            console.error('Failed to sync vote:', error);
            // Revert optimistic update on error
            // In a real app, you'd want to show an error message
        }
    },

    getVote: (targetId) => {
        return get().votes.get(targetId) || null;
    },

    getScore: (targetId) => {
        return get().scores.get(targetId) || 0;
    },

    getMetrics: (targetId) => {
        return get().metrics.get(targetId);
    },

    setVote: (targetId, voteType, score, metrics) => {
        set((state) => {
            const newVotes = new Map(state.votes);
            const newScores = new Map(state.scores);
            const newMetrics = new Map(state.metrics);

            newVotes.set(targetId, voteType);
            newScores.set(targetId, score);
            if (metrics) {
                newMetrics.set(targetId, metrics);
            }

            return { votes: newVotes, scores: newScores, metrics: newMetrics };
        });
    },
}));
