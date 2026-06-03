export type TextMark = 'strong' | 'em' | 'u' | 'small';

export type TextInline = {
  type: 'text';
  value: string;
  marks?: TextMark[];
};

export type VerseNumberInline = {
  type: 'verseNumber';
  n: string;
};

export type LinkInline = {
  type: 'link';
  href: string;
  children: (TextInline | VerseNumberInline)[];
};

export type Inline = TextInline | VerseNumberInline | LinkInline;

export type HeadingBlock = {
  type: 'heading';
  level: 2 | 3 | 4;
  children: TextInline[];
};

export type ParagraphBlock = {
  type: 'paragraph';
  children: Inline[];
};

export type BlockquoteBlock = {
  type: 'blockquote';
  children: ParagraphBlock[];
};

export type ListBlock = {
  type: 'list';
  ordered: boolean;
  items: Inline[][];
};

export type DividerBlock = {
  type: 'divider';
};

export type FootnoteBlock = {
  type: 'footnote';
  children: Inline[];
};

export type ImageBlock = {
  type: 'image';
  src: string;
  alt?: string;
  align?: 'left' | 'right' | 'center';
};

export type Block =
  | HeadingBlock
  | ParagraphBlock
  | BlockquoteBlock
  | ListBlock
  | DividerBlock
  | FootnoteBlock
  | ImageBlock;

export type Lesson = {
  slug: string;
  seriesSlug: string;
  sequence: number;
  title: string;
  description?: string;
  keywords?: string[];
  blocks: Block[];
  sourcePath: string;
  language: string;
};

export type SeriesManifest = {
  slug: string;
  title: string;
  description: string;
  category: 'paraphrase' | 'bible-study' | 'sermon' | 'topical' | 'standalone';
  language: string;
  lessonSlugs: string[];
};

export type Catalog = {
  generatedAt: string;
  schemaVersion: 1;
  series: SeriesManifest[];
  lessons: Lesson[];
};

export function blocksToPlainText(blocks: Block[]): string {
  return blocks
    .map(blockToPlainText)
    .filter(Boolean)
    .join('\n\n');
}

function blockToPlainText(block: Block): string {
  switch (block.type) {
    case 'heading':
      return block.children.map(child => child.value).join('');
    case 'paragraph':
      return block.children.map(inlineToPlainText).join('');
    case 'blockquote':
      return block.children
        .map(paragraph => paragraph.children.map(inlineToPlainText).join(''))
        .join('\n');
    case 'list':
      return block.items.map(row => row.map(inlineToPlainText).join('')).join('\n');
    case 'footnote':
      return block.children.map(inlineToPlainText).join('');
    case 'divider':
    case 'image':
      return '';
  }
}

function inlineToPlainText(inline: Inline): string {
  switch (inline.type) {
    case 'text':
      return inline.value;
    case 'verseNumber':
      return `[${inline.n}]`;
    case 'link':
      return inline.children.map(inlineToPlainText).join('');
  }
}
