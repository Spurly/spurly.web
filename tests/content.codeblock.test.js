import { describe, expect, test } from 'vitest';
import { parseBlocks } from '../scripts/contentParser.mjs';

/** Fenced code blocks in content pages (added for the developer API docs). */
describe('content parser: fenced code blocks', () => {
  test('keeps the code verbatim, including "<" and blank lines, with its language', () => {
    const blocks = parseBlocks('Intro.\n\n```json\n{ "a": "<b>" }\n\n{ "c": 1 }\n```\n\nAfter.');
    expect(blocks.map((b) => b.type)).toEqual(['p', 'code', 'p']);
    expect(blocks[1]).toEqual({ type: 'code', lang: 'json', text: '{ "a": "<b>" }\n\n{ "c": 1 }' });
  });

  test('a fence ends a paragraph', () => {
    const blocks = parseBlocks('Line one\n```\nx\n```');
    expect(blocks.map((b) => b.type)).toEqual(['p', 'code']);
    expect(blocks[1].lang).toBe('');
  });

  test('an unclosed fence is an error, not a page that swallows the rest', () => {
    expect(() => parseBlocks('```js\nconst a = 1;', 'x.md')).toThrow(/unclosed code block/);
  });

  test('raw HTML outside a code block is still rejected', () => {
    expect(() => parseBlocks('<div>hi</div>', 'x.md')).toThrow(/raw HTML/);
  });
});
