import type { CircuitClass } from './classify';

/** Compact per-circuit record (short keys keep index.json small). */
export interface IndexCircuit {
  o: string | null; // owner
  i: number; u: number; s: number; // nIn, nOut, nState
  g: number; // flattened gateCount (circuitInfo)
  n: number; l: number; r: number; // own NAND, LATCH, REF elements
  h: string; // keccak256(netlist)
  p: [string, number, number][]; // REF parents [cpu, id, uses]
  c: [string, number, number][]; // REF children [cpu, id, uses]
  t: number; // twin group index or -1
  k: CircuitClass;
  x: { block: number; timestamp: number | null; tx: string | null; source: string } | null;
}

export interface IndexTwinGroup {
  hash: string;
  nand: number; latch: number; ref: number;
  /** if the shared bytes contain REFs, every member cites these */
  cites: [string, number][];
  members: [string, number, string | null][];
  original: [string, number] | null;
  basis: 'block' | 'id-same-cpu' | 'unknown';
}

export type CpuStatus = 'scanned' | 'partial' | 'skipped' | 'empty'

export interface IndexCpu {
  a: string; n: string; y: string; x: number;
  c: number; // nextId at the snapshot block (ids run 1..c inclusive)
  i: number; // how many of those circuits are in this index
  st: CpuStatus;
  /** nextId at a later head, when we checked and it differed from the snapshot. */
  latest?: number;
}

export interface TracedIndex {
  meta: {
    chainId: number; block: number; factory: string; builtAt: string;
    circuitsIndexed: number; cpuCount: number; totalOnFactory: number;
    refEdges: number; twinGroups: number;
    skipped: { cpu: string; name: string; nextId: number; indexed?: number }[];
    shards: string[];
  };
  cpus: IndexCpu[];
  circuits: Record<string, IndexCircuit>;
  twins: IndexTwinGroup[];
  externalChildren: Record<string, [string, number, number][]>;
}
