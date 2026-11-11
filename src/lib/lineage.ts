// Multi-level REF family tree: ancestors via p, descendants via c.
// Distinct circuits are unique nodes; repeated REFs stay as a use count (never
// exploded into N leaves). Wide fan-outs collapse to "+k more".

import { keyOf } from './format';

export const DEFAULT_UP = 3;
export const DEFAULT_DOWN = 3;
export const FANOUT_LIMIT = 12;
export const FANOUT_LIMIT_SMALL = 8;
export const FANOUT_EXPAND_TO = 40;

export type NodeKey = string;

export interface EdgeRef { cpu: string; id: number; uses: number }

export interface LineageAccess {
  parents(cpu: string, id: number): EdgeRef[];
  children(cpu: string, id: number): EdgeRef[];
}

export function accessFromIndex(
  circuits: Record<string, { p?: [string, number, number][]; c?: [string, number, number][] }>,
  externalChildren: Record<string, [string, number, number][]> = {},
): LineageAccess {
  return {
    parents(cpu, id) {
      const r = circuits[keyOf(cpu, id)];
      return (r?.p ?? []).map(([c, i, u]) => ({ cpu: c, id: i, uses: u }));
    },
    children(cpu, id) {
      const k = keyOf(cpu, id);
      const r = circuits[k];
      const list = r?.c ?? externalChildren[k] ?? [];
      return list.map(([c, i, u]) => ({ cpu: c, id: i, uses: u }));
    },
  };
}

export interface FamilyNode {
  cpu: string;
  id: number;
  /** Citation count from the neighbouring node closer to the root (summed if several). */
  uses: number;
  /** If set, this is a "+N more" placeholder, not a real circuit. */
  more?: number;
  /** Circuits hidden behind a "+N more" placeholder, in first-seen order. */
  hidden?: EdgeRef[];
  /** The parent (closer to root) this placeholder belongs to. */
  via?: NodeKey;
}

export interface FamilyLevel { nodes: FamilyNode[] }

export interface FamilyEdge { parent: NodeKey; child: NodeKey; uses: number }

export interface FamilyTree {
  root: { cpu: string; id: number };
  /** up[0] is depth 1 (direct parents). */
  up: FamilyLevel[];
  /** down[0] is depth 1 (direct children). */
  down: FamilyLevel[];
  edges: FamilyEdge[];
}

export interface BuildOpts {
  upDepth?: number;
  downDepth?: number;
  /** Max real circuit leaves in one fan-out before collapsing (the "+k more" is an extra slot). */
  fanLimit?: number;
  /** `${cpu}:${id}:up|down` keys the user has expanded. */
  expanded?: Set<string>;
  /** How many to show once a fan-out is expanded (still collapses past this). */
  expandTo?: number;
}

function expandKey(cpu: string, id: number, dir: 'up' | 'down'): string {
  return `${keyOf(cpu, id)}:${dir}`;
}

function walk(
  access: LineageAccess,
  startCpu: string,
  startId: number,
  maxDepth: number,
  dir: 'up' | 'down',
  fanLimit: number,
  expanded: Set<string>,
  expandTo: number,
): { levels: FamilyLevel[]; edges: FamilyEdge[] } {
  const levels: FamilyLevel[] = [];
  const edges: FamilyEdge[] = [];
  if (maxDepth <= 0) return { levels, edges };

  const rootKey = keyOf(startCpu, startId);
  const seen = new Set<NodeKey>([rootKey]);
  let frontier: { cpu: string; id: number }[] = [{ cpu: startCpu, id: startId }];
  const neigh = (cpu: string, id: number) => (dir === 'up' ? access.parents(cpu, id) : access.children(cpu, id));

  for (let d = 1; d <= maxDepth && frontier.length; d++) {
    const nodesByKey = new Map<NodeKey, FamilyNode>();
    const placeholders: FamilyNode[] = [];
    const nextFrontier: { cpu: string; id: number }[] = [];

    for (const src of frontier) {
      const all = neigh(src.cpu, src.id);
      const ex = expanded.has(expandKey(src.cpu, src.id, dir));
      const limit = ex ? expandTo : fanLimit;
      const overflow = all.length > limit;
      const shown = overflow ? all.slice(0, Math.max(1, limit - 1)) : all;
      const rest = overflow ? all.slice(shown.length) : [];

      for (const n of shown) {
        const k = keyOf(n.cpu, n.id);
        const already = seen.has(k);
        // Edge is parent→child: when walking up, n is the parent of src; when down, src is the parent of n.
        if (dir === 'up') edges.push({ parent: k, child: keyOf(src.cpu, src.id), uses: n.uses });
        else edges.push({ parent: keyOf(src.cpu, src.id), child: k, uses: n.uses });
        if (already) {
          const existing = nodesByKey.get(k);
          if (existing) existing.uses += n.uses;
          continue;
        }
        seen.add(k);
        nodesByKey.set(k, { cpu: n.cpu, id: n.id, uses: n.uses });
        nextFrontier.push({ cpu: n.cpu, id: n.id });
      }
      if (rest.length) {
        placeholders.push({
          cpu: src.cpu, id: src.id, uses: 0,
          more: rest.length, hidden: rest, via: keyOf(src.cpu, src.id),
        });
      }
    }

    const nodes = [...nodesByKey.values(), ...placeholders];
    if (!nodes.length) break;
    levels.push({ nodes });
    frontier = nextFrontier;
  }
  return { levels, edges };
}

export function buildFamilyTree(
  access: LineageAccess,
  cpu: string,
  id: number,
  opts: BuildOpts = {},
): FamilyTree {
  const upDepth = opts.upDepth ?? DEFAULT_UP;
  const downDepth = opts.downDepth ?? DEFAULT_DOWN;
  const fanLimit = opts.fanLimit ?? FANOUT_LIMIT;
  const expanded = opts.expanded ?? new Set<string>();
  const expandTo = opts.expandTo ?? FANOUT_EXPAND_TO;
  const up = walk(access, cpu, id, upDepth, 'up', fanLimit, expanded, expandTo);
  const down = walk(access, cpu, id, downDepth, 'down', fanLimit, expanded, expandTo);
  return {
    root: { cpu, id },
    up: up.levels,
    down: down.levels,
    edges: [...up.edges, ...down.edges],
  };
}

/** Longest ancestor chain, capped. Cycles are ignored. */
export function depthUp(access: LineageAccess, cpu: string, id: number, cap = 12): number {
  const seen = new Set<NodeKey>();
  const rec = (c: string, i: number, left: number): number => {
    const k = keyOf(c, i);
    if (seen.has(k) || left <= 0) return 0;
    seen.add(k);
    const ps = access.parents(c, i);
    if (!ps.length) return 0;
    return 1 + Math.max(...ps.map(p => rec(p.cpu, p.id, left - 1)));
  };
  return rec(cpu, id, cap);
}

/** Longest descendant chain, capped. Cycles are ignored. */
export function depthDown(access: LineageAccess, cpu: string, id: number, cap = 12): number {
  const seen = new Set<NodeKey>();
  const rec = (c: string, i: number, left: number): number => {
    const k = keyOf(c, i);
    if (seen.has(k) || left <= 0) return 0;
    seen.add(k);
    const cs = access.children(c, i);
    if (!cs.length) return 0;
    return 1 + Math.max(...cs.map(ch => rec(ch.cpu, ch.id, left - 1)));
  };
  return rec(cpu, id, cap);
}

export function expandKeyOf(cpu: string, id: number, dir: 'up' | 'down'): string {
  return `${keyOf(cpu, id)}:${dir}`;
}

/** Count of real (non-placeholder) nodes across both sides. */
export function treeNodeCount(tree: FamilyTree): { up: number; down: number } {
  const real = (levels: FamilyLevel[]) => levels.reduce((a, l) => a + l.nodes.filter(n => !n.more).length, 0);
  return { up: real(tree.up), down: real(tree.down) };
}
