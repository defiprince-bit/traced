import { describe, expect, it } from 'vitest';
import { CEREBR } from '../src/route';
import { copyFinding, namedTwin } from '../src/app/CopyView';

const members: [string, number][] = [[CEREBR, 4], [CEREBR, 34]];

describe('namedTwin', () => {
  it('uses vs when it is another member, even on the original’s page', () => {
    expect(namedTwin(CEREBR, 4, 34, members)).toEqual([CEREBR, 34]);
    expect(namedTwin(CEREBR, 34, 4, members)).toEqual([CEREBR, 4]);
  });
  it('falls back to the first other member when vs is missing or is the lookup itself', () => {
    expect(namedTwin(CEREBR, 4, null, members)).toEqual([CEREBR, 34]);
    expect(namedTwin(CEREBR, 4, 4, members)).toEqual([CEREBR, 34]);
    expect(namedTwin(CEREBR, 34, null, members)).toEqual([CEREBR, 4]);
  });
});

describe('copyFinding', () => {
  it('marks the likely original and names the other twin, never “#4 is byte-for-byte #4”', () => {
    const withVs = copyFinding({ id: 4, silent: true, isOriginal: true, originalId: 4, namedId: 34 });
    expect(withVs).toEqual({ tag: 'orig', headline: '#4 is the likely original of #34' });
    expect(withVs.headline).not.toMatch(/byte-for-byte #4/);

    const noVs = copyFinding({ id: 4, silent: true, isOriginal: true, originalId: 4, namedId: 34 });
    expect(noVs.tag).toBe('orig');
    expect(noVs.headline).toBe('#4 is the likely original of #34');
  });

  it('keeps the copy page as a silent copy of the original', () => {
    expect(copyFinding({ id: 34, silent: true, isOriginal: false, originalId: 4, namedId: 4 })).toEqual({
      tag: 'copy',
      headline: '#34 is byte-for-byte #4',
    });
  });

  it('uses the citations wording when the shared bytes contain REFs', () => {
    expect(copyFinding({ id: 12, silent: false, isOriginal: false, originalId: null, namedId: 9 })).toEqual({
      tag: 'ok',
      headline: '#12 shares citations',
    });
  });
});
