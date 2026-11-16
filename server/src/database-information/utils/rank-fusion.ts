import { KNOWLEDGE_SEARCH_RRF_K } from '../constants/database-information.constant';

/**
 * Reciprocal Rank Fusion: each ranking contributes 1 / (k + position) to every
 * id it contains, and ids are ordered by the sum. It merges rankings whose
 * scores are not comparable (cosine similarity vs. full-text rank) without
 * any weight to calibrate. Ties keep the order of first appearance.
 */
export function fuseRankings(
  rankings: string[][],
  k = KNOWLEDGE_SEARCH_RRF_K,
): { id: string; score: number }[] {
  const scores = new Map<string, number>();

  for (const ranking of rankings) {
    ranking.forEach((id, index) => {
      scores.set(id, (scores.get(id) ?? 0) + 1 / (k + index + 1));
    });
  }

  return [...scores.entries()]
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score);
}
