import { fuseRankings } from './rank-fusion';

describe('fuseRankings', () => {
  it('ranks an id present in both rankings above ids present in one', () => {
    const fused = fuseRankings([
      ['a', 'b', 'c'],
      ['c', 'd'],
    ]);

    expect(fused[0].id).toBe('c');
    expect(fused.map((item) => item.id).sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('scores 1 / (k + position) per ranking', () => {
    const [only] = fuseRankings([['a'], ['a']], 60);

    expect(only.score).toBeCloseTo(2 / 61);
  });

  it('returns nothing for empty rankings', () => {
    expect(fuseRankings([[], []])).toEqual([]);
  });
});
