// eval()/step() pack bits LSB-first per byte: bit i = (byte[i>>3] >> (i&7)) & 1.
export function packBits(bits: number[]): `0x${string}` {
  const n = Math.max(1, Math.ceil(bits.length / 8));
  const out = new Uint8Array(n);
  bits.forEach((b, i) => { if (b) out[i >> 3] |= 1 << (i & 7); });
  return ('0x' + [...out].map(x => x.toString(16).padStart(2, '0')).join('')) as `0x${string}`;
}
export function unpackBits(hex: string, count: number): number[] {
  const h = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bits: number[] = [];
  for (let i = 0; i < count; i++) {
    const byte = parseInt(h.slice((i >> 3) * 2, (i >> 3) * 2 + 2) || '00', 16);
    bits.push((byte >> (i & 7)) & 1);
  }
  return bits;
}
/** Row r of a truth table over n inputs: bit i of r is input i. */
export const rowBits = (r: number, n: number) => Array.from({ length: n }, (_, i) => (r >> i) & 1);
