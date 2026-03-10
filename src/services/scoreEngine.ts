import type { RiskCard, TabCategory } from '../data/riskFramework';

// ─── Types ────────────────────────────────────────────────────────────────────
export type ScoreColor = 'green' | 'yellow' | 'red';

export interface CategoryScore {
    score: number;       // 0–100
    riskCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    color: ScoreColor;
    label: string;
}

export interface ContractScores {
    overall: number;
    overallColor: ScoreColor;
    overallLabel: string;
    categories: Record<TabCategory, CategoryScore>;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DEDUCTIONS: Record<'High' | 'Medium' | 'Low', number> = {
    High: 15,
    Medium: 7,
    Low: 3,
};

const ALL_TABS: TabCategory[] = ['Vận hành', 'Pháp lý', 'Kỹ thuật', 'Tài chính'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getScoreColor(score: number): ScoreColor {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    return 'red';
}

function getScoreLabel(score: number): string {
    if (score >= 80) return 'Tốt';
    if (score >= 60) return 'Cần xem xét';
    return 'Rủi ro cao';
}

function clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, n));
}

// ─── Main export ──────────────────────────────────────────────────────────────
/**
 * Calculates contract scores deterministically from risk findings.
 * Same risks → same score. AI never touches this function.
 */
export function calculateScores(risks: RiskCard[]): ContractScores {
    const categoryScores = {} as Record<TabCategory, CategoryScore>;

    for (const tab of ALL_TABS) {
        const tabRisks = risks.filter((r) => r.tab === tab);
        const highCount = tabRisks.filter((r) => r.level === 'High').length;
        const mediumCount = tabRisks.filter((r) => r.level === 'Medium').length;
        const lowCount = tabRisks.filter((r) => r.level === 'Low').length;

        const totalDeduction =
            highCount * DEDUCTIONS.High +
            mediumCount * DEDUCTIONS.Medium +
            lowCount * DEDUCTIONS.Low;

        const score = clamp(100 - totalDeduction, 0, 100);
        const color = getScoreColor(score);
        const label = getScoreLabel(score);

        categoryScores[tab] = {
            score,
            riskCount: tabRisks.length,
            highCount,
            mediumCount,
            lowCount,
            color,
            label,
        };
    }

    // Overall = average of 4 categories
    const overall = Math.round(
        ALL_TABS.reduce((sum, tab) => sum + categoryScores[tab].score, 0) / ALL_TABS.length
    );

    return {
        overall,
        overallColor: getScoreColor(overall),
        overallLabel: getScoreLabel(overall),
        categories: categoryScores,
    };
}

// ─── UI Color Maps ─────────────────────────────────────────────────────────────
export const SCORE_STYLES: Record<ScoreColor, {
    bg: string;
    text: string;
    ring: string;
    bar: string;
    badge: string;
}> = {
    green: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
        ring: 'ring-emerald-400',
        bar: 'bg-emerald-400',
        badge: 'bg-emerald-100 text-emerald-700',
    },
    yellow: {
        bg: 'bg-amber-50',
        text: 'text-amber-500',
        ring: 'ring-amber-400',
        bar: 'bg-amber-400',
        badge: 'bg-amber-100 text-amber-700',
    },
    red: {
        bg: 'bg-red-50',
        text: 'text-red-600',
        ring: 'ring-red-400',
        bar: 'bg-red-400',
        badge: 'bg-red-100 text-red-700',
    },
};
