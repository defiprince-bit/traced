import { CEREBR } from '../route';

/** Well-known Cerebr names from the research brief / README. Unlisted circuits stay unnamed. */
export const KNOWN_NAMES: Record<string, string> = {
  [`${CEREBR}:1`]: 'AND',
  [`${CEREBR}:2`]: 'OR',
  [`${CEREBR}:4`]: 'XOR, official',
  [`${CEREBR}:5`]: 'XOR',
  [`${CEREBR}:12`]: 'Line detector',
};

export const circuitName = (cpu: string, id: number) => KNOWN_NAMES[`${cpu.toLowerCase()}:${id}`] ?? '';
