import {
  KNOWLEDGE_CHUNK_MAX_CHARS,
  KNOWLEDGE_CHUNK_TARGET_CHARS,
} from '../constants/database-information.constant';
import { chunkKnowledgeText } from './knowledge-chunker';

const bodyOf = (chunk: string) => chunk.split('\n\n').slice(1).join('\n\n');

describe('chunkKnowledgeText', () => {
  it('returns no chunk for an empty text', () => {
    expect(chunkKnowledgeText('Casa', '  \n\n ')).toEqual([]);
  });

  it('keeps a short text in one chunk with the base header', () => {
    expect(chunkKnowledgeText('Casa', 'senha do wifi: girassol123')).toEqual([
      'Base: Casa\n\nsenha do wifi: girassol123',
    ]);
  });

  it('opens a section on markdown headings and "Label:" lines', () => {
    const chunks = chunkKnowledgeText(
      'Casa',
      '# Wi-Fi\nsenha: girassol123\n\nContatos:\nAna 99999-0000',
    );

    expect(chunks).toEqual([
      'Base: Casa\nSeção: Wi-Fi\n\nsenha: girassol123',
      'Base: Casa\nSeção: Contatos\n\nAna 99999-0000',
    ]);
  });

  it('normalises CRLF and extra blank lines', () => {
    expect(chunkKnowledgeText('B', 'a  \r\n\r\n\r\n\r\nb')).toEqual([
      'Base: B\n\na\n\nb',
    ]);
  });

  it('splits long texts near the target size and never past the max', () => {
    const paragraphs = Array.from(
      { length: 30 },
      (_, index) => `Item ${index}: ${'palavra '.repeat(20).trim()}.`,
    );
    const chunks = chunkKnowledgeText('Lista', paragraphs.join('\n\n'));

    expect(chunks.length).toBeGreaterThan(3);
    for (const chunk of chunks) {
      expect(bodyOf(chunk).length).toBeLessThanOrEqual(
        KNOWLEDGE_CHUNK_MAX_CHARS,
      );
    }
    // Every paragraph is in at least one chunk.
    for (const paragraph of paragraphs) {
      expect(chunks.some((chunk) => chunk.includes(paragraph))).toBe(true);
    }
  });

  it('repeats the tail of a chunk at the start of the next one', () => {
    const paragraphs = Array.from(
      { length: 12 },
      (_, index) => `Parágrafo ${index} ${'texto '.repeat(30).trim()}`,
    );
    const [first, second] = chunkKnowledgeText('B', paragraphs.join('\n\n'));
    const tailWords = bodyOf(first).split(' ').slice(-5).join(' ');

    expect(bodyOf(second)).toContain(tailWords);
  });

  it('splits a single huge line (CSV row, long paragraph) by sentences and words', () => {
    const sentence = `${'x'.repeat(80)}. `;
    const text = sentence.repeat(
      Math.ceil((KNOWLEDGE_CHUNK_TARGET_CHARS * 4) / sentence.length),
    );
    const hugeWord = 'y'.repeat(KNOWLEDGE_CHUNK_MAX_CHARS * 2 + 10);

    for (const chunk of [
      ...chunkKnowledgeText('B', text),
      ...chunkKnowledgeText('B', hugeWord),
    ]) {
      expect(bodyOf(chunk).length).toBeLessThanOrEqual(
        KNOWLEDGE_CHUNK_MAX_CHARS,
      );
    }
    expect(chunkKnowledgeText('B', hugeWord).join('')).toContain(
      'y'.repeat(100),
    );
  });

  it('does not emit a chunk made only of the carried overlap', () => {
    const big = `${'a '.repeat(520).trim()}`;
    const chunks = chunkKnowledgeText('B', `${big}\n\n${big}\n\n# Fim\nok`);
    const last = chunks[chunks.length - 1];

    expect(last).toBe('Base: B\nSeção: Fim\n\nok');
    expect(chunks.filter((chunk) => !chunk.includes('Seção'))).toHaveLength(2);
  });
});
