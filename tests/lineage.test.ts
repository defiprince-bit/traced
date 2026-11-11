import { describe, expect, it } from 'vitest';
import {
  accessFromIndex, buildFamilyTree, depthDown, depthUp, expandKeyOf, treeNodeCount,
  FANOUT_LIMIT_SMALL,
} from '../src/lib/lineage';

const C = '0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff';
const B = '0xb00e17789f905234f1890c22e6c01015c10d2f54';

/** Tiny in-memory census shaped like IndexCircuit p/c arrays. */
function graph(spec: Record<string, { p?: [string, number, number][]; c?: [string, number, number][] }>) {
  return accessFromIndex(spec);
}

describe('family tree depth', () => {
  const ix = graph({
    // Cerebr #5 XOR wrapper ← #2, #3, #1 (libraries, no parents)
    [`${C}:5`]: { p: [[C, 2, 1], [C, 3, 1], [C, 1, 1]], c: [] },
    [`${C}:2`]: { p: [], c: [[C, 5, 1]] },
    [`${C}:3`]: { p: [], c: [[C, 5, 1], [C, 37, 108]] },
    [`${C}:1`]: { p: [], c: [[C, 5, 1]] },
    [`${C}:37`]: { p: [[C, 3, 108]], c: [] },
    // A depth-2 chain on another CPU: 3 ← 36 ← 41, plus siblings
    [`${B}:3`]: { p: [], c: [[B, 36, 1]] },
    [`${B}:4`]: { p: [], c: [[B, 36, 1]] },
    [`${B}:5`]: { p: [], c: [[B, 38, 1]] },
    [`${B}:36`]: { p: [[B, 3, 1], [B, 4, 1]], c: [[B, 41, 1]] },
    [`${B}:37`]: { p: [[B, 3, 1], [B, 4, 1]], c: [[B, 41, 1]] },
    [`${B}:38`]: { p: [[B, 5, 1]], c: [[B, 41, 1]] },
    [`${B}:39`]: { p: [[B, 5, 1]], c: [[B, 41, 1]] },
    [`${B}:40`]: { p: [[B, 5, 1]], c: [[B, 41, 1]] },
    [`${B}:41`]: { p: [[B, 36, 1], [B, 37, 1], [B, 38, 1], [B, 39, 1], [B, 40, 1]], c: [] },
  });

  it('walks #5 ancestors one level even when depth is 3, and finds no descendants', () => {
    expect(depthUp(ix, C, 5)).toBe(1);
    expect(depthDown(ix, C, 5)).toBe(0);
    const t = buildFamilyTree(ix, C, 5, { upDepth: 3, downDepth: 3 });
    expect(t.up).toHaveLength(1);
    expect(t.up[0].nodes.map(n => n.id).sort((a, b) => a - b)).toEqual([1, 2, 3]);
    expect(t.down).toHaveLength(0);
    expect(treeNodeCount(t)).toEqual({ up: 3, down: 0 });
  });

  it('caps ancestor depth: a 2-long chain is truncated at 1', () => {
    expect(depthUp(ix, B, 41)).toBe(2);
    const d1 = buildFamilyTree(ix, B, 41, { upDepth: 1, downDepth: 0 });
    expect(d1.up).toHaveLength(1);
    expect(d1.up[0].nodes.map(n => n.id).sort((a, b) => a - b)).toEqual([36, 37, 38, 39, 40]);
    expect(d1.up[0].nodes.every(n => !n.more)).toBe(true);
    const d2 = buildFamilyTree(ix, B, 41, { upDepth: 2, downDepth: 0 });
    expect(d2.up).toHaveLength(2);
    expect(d2.up[1].nodes.map(n => n.id).sort((a, b) => a - b)).toEqual([3, 4, 5]);
    // #3 is a shared ancestor of #36 and #37 — one node, uses summed
    const n3 = d2.up[1].nodes.find(n => n.id === 3);
    expect(n3?.uses).toBe(2);
  });

  it('walks #3 descendants as two grouped children, never 109 leaves', () => {
    expect(depthDown(ix, C, 3)).toBe(1);
    const t = buildFamilyTree(ix, C, 3, { upDepth: 3, downDepth: 3 });
    expect(t.down).toHaveLength(1);
    const ids = t.down[0].nodes.map(n => n.id);
    expect(ids).toEqual([5, 37]);
    expect(t.down[0].nodes.find(n => n.id === 37)?.uses).toBe(108);
    expect(t.down[0].nodes.find(n => n.id === 5)?.uses).toBe(1);
    expect(treeNodeCount(t).down).toBe(2);
  });
});

describe('fan-out grouping', () => {
  const parent = '0xabc0000000000000000000000000000000000001';
  const child = (n: number): [string, number, number] => [parent, n, 1];
  const circuits: Record<string, { p: [string, number, number][]; c: [string, number, number][] }> = {
    [`${parent}:1`]: { p: [], c: Array.from({ length: 20 }, (_, i) => child(i + 2)) },
  };
  for (let i = 2; i <= 21; i++) circuits[`${parent}:${i}`] = { p: [[parent, 1, 1]], c: [] };
  const ix = graph(circuits);

  it('collapses a 20-child fan-out to limit-1 leaves plus a +k more placeholder', () => {
    const t = buildFamilyTree(ix, parent, 1, { upDepth: 0, downDepth: 1, fanLimit: FANOUT_LIMIT_SMALL });
    const nodes = t.down[0].nodes;
    const real = nodes.filter(n => !n.more);
    const more = nodes.filter(n => n.more);
    expect(real).toHaveLength(FANOUT_LIMIT_SMALL - 1);
    expect(more).toHaveLength(1);
    expect(more[0].more).toBe(20 - (FANOUT_LIMIT_SMALL - 1));
    expect(more[0].hidden).toHaveLength(20 - (FANOUT_LIMIT_SMALL - 1));
    expect(real.map(n => n.id)).toEqual([2, 3, 4, 5, 6, 7, 8]);
  });

  it('does not collapse when the fan-out fits in the limit', () => {
    const t = buildFamilyTree(ix, parent, 1, { upDepth: 0, downDepth: 1, fanLimit: 20 });
    expect(t.down[0].nodes.every(n => !n.more)).toBe(true);
    expect(t.down[0].nodes).toHaveLength(20);
  });

  it('reveals hidden children when the source node is in the expanded set', () => {
    const t = buildFamilyTree(ix, parent, 1, {
      upDepth: 0, downDepth: 1, fanLimit: FANOUT_LIMIT_SMALL,
      expanded: new Set([expandKeyOf(parent, 1, 'down')]),
      expandTo: 40,
    });
    expect(t.down[0].nodes.every(n => !n.more)).toBe(true);
    expect(t.down[0].nodes).toHaveLength(20);
  });

  it('still groups after expand if the fan-out is larger than expandTo', () => {
    const t = buildFamilyTree(ix, parent, 1, {
      upDepth: 0, downDepth: 1, fanLimit: 4,
      expanded: new Set([expandKeyOf(parent, 1, 'down')]),
      expandTo: 10,
    });
    const real = t.down[0].nodes.filter(n => !n.more);
    const more = t.down[0].nodes.find(n => n.more);
    expect(real).toHaveLength(9);
    expect(more?.more).toBe(11);
  });
});

describe('cycles and missing records', () => {
  it('does not loop on a cyclic citation', () => {
    const ix = graph({
      '0xaa:1': { p: [['0xaa', 2, 1]], c: [['0xaa', 2, 1]] },
      '0xaa:2': { p: [['0xaa', 1, 1]], c: [['0xaa', 1, 1]] },
    });
    expect(depthUp(ix, '0xaa', 1, 12)).toBeLessThanOrEqual(2);
    const t = buildFamilyTree(ix, '0xaa', 1, { upDepth: 5, downDepth: 5 });
    const ids = [...t.up, ...t.down].flatMap(l => l.nodes.map(n => n.id));
    expect(ids.filter(id => id === 2).length).toBeGreaterThan(0);
    // #1 is the root, not repeated as a node
    expect(ids.includes(1)).toBe(false);
  });

  it('stops at the edge of the index (parent with no record)', () => {
    const ix = graph({
      '0xaa:5': { p: [['0xbb', 9, 2]], c: [] },
    });
    const t = buildFamilyTree(ix, '0xaa', 5, { upDepth: 3, downDepth: 3 });
    expect(t.up).toHaveLength(1);
    expect(t.up[0].nodes).toEqual([{ cpu: '0xbb', id: 9, uses: 2 }]);
    expect(t.up[1]).toBeUndefined();
  });
});
