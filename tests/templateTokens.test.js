import { describe, it, expect } from 'vitest';
import { previewTemplate, findUnknownTokens, insertTokenAt } from 'src/shared/utils/templateTokens.js';

describe('template tokens', () => {
  it('substitutes known tokens', () => {
    expect(previewTemplate('Hi {{name}}!', { name: 'Ada' })).toBe('Hi Ada!');
  });

  it('STRIPS an unknown token rather than sending it verbatim', () => {
    // The rule that matters: a typo'd token must never reach a recipient as
    // literal "{{fistName}}". It is removed and the gap tidied.
    const out = previewTemplate('Hi {{fistName}}, quick question', { });
    expect(out).not.toContain('{{');
    expect(out).toBe('Hi, quick question');
  });

  it('reports unknown tokens so the editor can warn', () => {
    expect(findUnknownTokens('Hi {{name}} at {{nope}} and {{alsoNope}}'))
      .toEqual(expect.arrayContaining(['nope', 'alsoNope']));
    expect(findUnknownTokens('Hi {{name}}')).toEqual([]);
  });

  it('inserts a token at the caret and reports where the caret lands', () => {
    const { text, caret } = insertTokenAt('Hi , welcome', '{{name}}', 3, 3);
    expect(text).toBe('Hi {{name}}, welcome');
    expect(caret).toBe(11);
  });
});
