// Load a circuit and every REF target it needs so stepLocal can run in the browser.
import { decodeNetlist } from './netlist';
import { readCircuit } from './xlayer';
import type { ResolveCircuit, SimCircuit } from './sim';

export interface SimForest {
  root: SimCircuit;
  resolve: ResolveCircuit;
  missing: { cpu: string; id: number }[];
}

export async function loadSimForest(
  netlist: string,
  nIn: number,
  nOut: number,
  nState: number,
): Promise<SimForest> {
  const map = new Map<string, SimCircuit>();
  const missing: { cpu: string; id: number }[] = [];
  const seen = new Set<string>();

  async function hydrate(hex: string, pins: { nIn: number; nOut: number; nState: number }): Promise<SimCircuit> {
    const d = decodeNetlist(hex);
    const circ: SimCircuit = { nIn: pins.nIn, nOut: pins.nOut, nState: pins.nState, elements: d.elements };
    for (const el of d.elements) {
      if (el.tag !== 'ref') continue;
      const k = `${el.cpu.toLowerCase()}:${el.id}`;
      if (map.has(k) || seen.has(k)) continue;
      seen.add(k);
      try {
        const live = await readCircuit(el.cpu, el.id);
        const sub = await hydrate(live.netlist, { nIn: live.nIn, nOut: live.nOut, nState: live.nState });
        map.set(k, sub);
      } catch {
        missing.push({ cpu: el.cpu.toLowerCase(), id: el.id });
      }
    }
    return circ;
  }

  const root = await hydrate(netlist, { nIn, nOut, nState });
  const resolve: ResolveCircuit = (cpu, id) => map.get(`${cpu.toLowerCase()}:${id}`) ?? null;
  return { root, resolve, missing };
}
