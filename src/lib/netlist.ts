// TapeOut netlist wire format (X Layer circuits contract):
//   NAND  = 00 | a:u24 | b:u24
//   LATCH = 01 | d:u24
//   REF   = 02 | cpu:20 bytes | id:u64 | nIn:u8 | nOut:u8 | ins:u24 * nIn
// Signals: 0 = const0, 1 = const1, inputs start at 2; each element appends its outputs.

export interface RefElement {
  cpu: `0x${string}`;
  id: number;
  nIn: number;
  nOut: number;
  ins: number[];
}

export type NetlistElement =
  | { tag: 'nand'; a: number; b: number }
  | { tag: 'latch'; d: number }
  | { tag: 'ref'; cpu: `0x${string}`; id: number; nIn: number; nOut: number; ins: number[] };

export interface DecodedNetlist {
  nand: number;
  latch: number;
  refs: RefElement[];
  elements: NetlistElement[];
  bytes: number;
  error: string | null;
}

function hexToBytes(hex: string): Uint8Array {
  const h = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (h.length % 2 !== 0) throw new Error('odd-length hex');
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}

const u24 = (b: Uint8Array, o: number) => (b[o] << 16) | (b[o + 1] << 8) | b[o + 2];

export function decodeNetlist(hex: string): DecodedNetlist {
  const b = hexToBytes(hex);
  const res: DecodedNetlist = { nand: 0, latch: 0, refs: [], elements: [], bytes: b.length, error: null };
  let o = 0;
  while (o < b.length) {
    const tag = b[o];
    if (tag === 0x00) {
      if (o + 7 > b.length) return { ...res, error: `truncated NAND at byte ${o}` };
      res.nand++;
      res.elements.push({ tag: 'nand', a: u24(b, o + 1), b: u24(b, o + 4) });
      o += 7;
    } else if (tag === 0x01) {
      if (o + 4 > b.length) return { ...res, error: `truncated LATCH at byte ${o}` };
      res.latch++;
      res.elements.push({ tag: 'latch', d: u24(b, o + 1) });
      o += 4;
    } else if (tag === 0x02) {
      if (o + 31 > b.length) return { ...res, error: `truncated REF at byte ${o}` };
      let cpu = '0x';
      for (let i = 1; i <= 20; i++) cpu += b[o + i].toString(16).padStart(2, '0');
      let id = 0n;
      for (let i = 21; i <= 28; i++) id = (id << 8n) | BigInt(b[o + i]);
      const nIn = b[o + 29];
      const nOut = b[o + 30];
      const end = o + 31 + nIn * 3;
      if (end > b.length) return { ...res, error: `truncated REF inputs at byte ${o}` };
      const ins: number[] = [];
      for (let k = 0; k < nIn; k++) ins.push(u24(b, o + 31 + k * 3));
      const ref: RefElement = { cpu: cpu as `0x${string}`, id: Number(id), nIn, nOut, ins };
      res.refs.push(ref);
      res.elements.push({ tag: 'ref', ...ref });
      o = end;
    } else {
      return { ...res, error: `unknown tag 0x${tag.toString(16)} at byte ${o}` };
    }
  }
  return res;
}

/** Unique parents with how many times each is referenced, in first-seen order. */
export function refParents(refs: RefElement[]): { cpu: string; id: number; uses: number }[] {
  const m = new Map<string, { cpu: string; id: number; uses: number }>();
  for (const r of refs) {
    const k = `${r.cpu.toLowerCase()}:${r.id}`;
    const e = m.get(k);
    if (e) e.uses++;
    else m.set(k, { cpu: r.cpu.toLowerCase(), id: r.id, uses: 1 });
  }
  return [...m.values()];
}
