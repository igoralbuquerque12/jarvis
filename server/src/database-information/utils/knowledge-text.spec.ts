import {
  hashKnowledgeContent,
  toOrTsQuery,
  toVectorLiteral,
} from './knowledge-text';

describe('knowledge text helpers', () => {
  it('hashes the same text to the same value', () => {
    expect(hashKnowledgeContent('abc')).toBe(hashKnowledgeContent('abc'));
    expect(hashKnowledgeContent('abc')).not.toBe(hashKnowledgeContent('abd'));
  });

  it('formats a pgvector literal', () => {
    expect(toVectorLiteral([0.1, -2, 3])).toBe('[0.1,-2,3]');
  });

  it('builds an OR tsquery of letters and digits only', () => {
    expect(toOrTsQuery("Qual a senha do Wi-Fi? (casa) & 'quarto' 2")).toBe(
      'qual | a | senha | do | wi | fi | casa | quarto | 2',
    );
    expect(toOrTsQuery('ação ação')).toBe('ação');
    expect(toOrTsQuery(' !?& ')).toBe('');
  });
});
