import {
  KNOWLEDGE_CHUNK_MAX_CHARS,
  KNOWLEDGE_CHUNK_OVERLAP_CHARS,
  KNOWLEDGE_CHUNK_TARGET_CHARS,
  KNOWLEDGE_SECTION_LABEL_MAX_CHARS,
} from '../constants/database-information.constant';

const MARKDOWN_HEADING = /^#{1,6}\s+(.+)$/;

/**
 * Splits a knowledge base into the chunks that get embedded and searched.
 *
 * Structure first, size second: paragraphs (blank-line separated) are the
 * units; a markdown heading or a short "Label:" line opens a new section and
 * closes the current chunk; oversized paragraphs are split by lines (lists,
 * tables, CSV rows), then sentences, then words. Consecutive chunks of the
 * same section share an overlap so a fact cut at the border is still whole in
 * one of them.
 *
 * Every chunk starts with a header naming the base and the section: a short
 * line like "senha: 1234" alone has almost no meaning for the embedding.
 */
export function chunkKnowledgeText(baseName: string, text: string): string[] {
  const chunks: { body: string; section: string | null }[] = [];
  let parts: string[] = [];
  let length = 0;
  let section: string | null = null;
  // True while `parts` holds only the overlap carried from the last chunk.
  let onlyOverlap = false;

  const flush = (withOverlap: boolean) => {
    if (parts.length > 0 && !onlyOverlap) {
      const body = parts.join('\n\n');
      chunks.push({ body, section });

      const tail = withOverlap ? overlapTail(body) : '';
      parts = tail ? [tail] : [];
      length = tail.length;
      onlyOverlap = parts.length > 0;
      return;
    }

    parts = [];
    length = 0;
    onlyOverlap = false;
  };

  for (const block of toBlocks(normalize(text))) {
    const lines = block.split('\n');
    const heading = readSectionLabel(lines[0]);

    if (heading !== null) {
      flush(false);
      section = heading;
      lines.shift();
    }

    const content = lines.join('\n').trim();
    if (!content) {
      continue;
    }

    for (const piece of splitToFit(content)) {
      const separator = parts.length > 0 ? 2 : 0;

      if (
        parts.length > 0 &&
        length + separator + piece.length > KNOWLEDGE_CHUNK_TARGET_CHARS
      ) {
        flush(true);

        // The overlap is dropped when it would push the chunk past the max.
        if (length + 2 + piece.length > KNOWLEDGE_CHUNK_MAX_CHARS) {
          parts = [];
          length = 0;
        }
      }

      length += (parts.length > 0 ? 2 : 0) + piece.length;
      parts.push(piece);
      onlyOverlap = false;
    }
  }

  // A trailing overlap alone is not a chunk (flush ignores it).
  flush(false);

  return chunks.map(({ body, section: label }) =>
    [`Base: ${baseName}`, label ? `Seção: ${label}` : null, '', body]
      .filter((line) => line !== null)
      .join('\n'),
  );
}

function normalize(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function toBlocks(text: string): string[] {
  return text ? text.split(/\n\s*\n/) : [];
}

/** "## Contatos" → "Contatos"; "Wi-Fi da casa:" → "Wi-Fi da casa"; otherwise null. */
function readSectionLabel(line: string | undefined): string | null {
  const trimmed = line?.trim() ?? '';
  const markdown = MARKDOWN_HEADING.exec(trimmed);

  if (markdown) {
    return markdown[1].replace(/#+$/, '').trim() || null;
  }

  if (
    trimmed.endsWith(':') &&
    trimmed.length > 1 &&
    trimmed.length <= KNOWLEDGE_SECTION_LABEL_MAX_CHARS
  ) {
    return trimmed.slice(0, -1).trim() || null;
  }

  return null;
}

/** Breaks a paragraph into pieces of at most KNOWLEDGE_CHUNK_MAX_CHARS. */
function splitToFit(content: string): string[] {
  if (content.length <= KNOWLEDGE_CHUNK_MAX_CHARS) {
    return [content];
  }

  const lines = content
    .split('\n')
    .flatMap((line) =>
      line.length <= KNOWLEDGE_CHUNK_MAX_CHARS ? [line] : splitLongLine(line),
    );

  return packGreedy(lines, '\n');
}

function splitLongLine(line: string): string[] {
  const sentences = line
    .split(/(?<=[.!?;])\s+/)
    .flatMap((sentence) =>
      sentence.length <= KNOWLEDGE_CHUNK_MAX_CHARS
        ? [sentence]
        : splitByWords(sentence),
    );

  return packGreedy(sentences, ' ');
}

function splitByWords(sentence: string): string[] {
  const pieces: string[] = [];
  let current = '';

  for (const word of sentence.split(/\s+/)) {
    // A single "word" longer than the max (a URL, a hash) is cut as is.
    for (
      let start = 0;
      start < word.length;
      start += KNOWLEDGE_CHUNK_MAX_CHARS
    ) {
      const slice = word.slice(start, start + KNOWLEDGE_CHUNK_MAX_CHARS);

      if (
        current &&
        current.length + 1 + slice.length > KNOWLEDGE_CHUNK_MAX_CHARS
      ) {
        pieces.push(current);
        current = slice;
      } else {
        current = current ? `${current} ${slice}` : slice;
      }
    }
  }

  return current ? [...pieces, current] : pieces;
}

/** Joins consecutive items with `separator` while they fit in the max. */
function packGreedy(items: string[], separator: string): string[] {
  const packed: string[] = [];
  let current = '';

  for (const item of items) {
    if (!item) {
      continue;
    }

    if (
      current &&
      current.length + separator.length + item.length >
        KNOWLEDGE_CHUNK_MAX_CHARS
    ) {
      packed.push(current);
      current = item;
    } else {
      current = current ? `${current}${separator}${item}` : item;
    }
  }

  return current ? [...packed, current] : packed;
}

/** Last ~KNOWLEDGE_CHUNK_OVERLAP_CHARS of a chunk, starting at a word border. */
function overlapTail(body: string): string {
  if (body.length <= KNOWLEDGE_CHUNK_OVERLAP_CHARS) {
    return '';
  }

  const tail = body.slice(-KNOWLEDGE_CHUNK_OVERLAP_CHARS);
  const border = tail.search(/\s/);

  return (border >= 0 ? tail.slice(border) : tail).trim();
}
