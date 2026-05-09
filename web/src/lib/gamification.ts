export const LEVEL_CURVE = 100; // XP needed for level 1 -> 2

export function calculateLevel(xp: number): { level: number; progress: number; nextLevelXp: number } {
    // Simple linear or quadratic curve?
    // Let's go with a slightly increasing curve: XP = Level * 100
    // Level = floor(XP / 100) + 1

    const level = Math.floor(xp / LEVEL_CURVE) + 1;
    const currentLevelBaseXp = (level - 1) * LEVEL_CURVE;
    const nextLevelXp = level * LEVEL_CURVE;
    const progress = ((xp - currentLevelBaseXp) / LEVEL_CURVE) * 100;

    return { level, progress, nextLevelXp };
}

export function getLevelTitle(level: number): string {
    if (level >= 50) return 'Sage';
    if (level >= 40) return 'Archmage';
    if (level >= 30) return 'Master';
    if (level >= 20) return 'Expert';
    if (level >= 10) return 'Apprentice';
    if (level >= 5) return 'Novice';
    return 'Beginner';
}
