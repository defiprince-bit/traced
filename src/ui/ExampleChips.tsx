import { CEREBR, toHash } from '../route';

export const EXAMPLE_CHIPS = [
  { id: 5, vs: null as number | null, view: 'lookup' as const, label: 'XOR, built from 3 parts', mono: '#5' },
  { id: 4, vs: 34, view: 'copy' as const, label: 'a silent copy', mono: '#4 vs #34' },
  { id: 12, vs: null, view: 'lineage' as const, label: '11 REFs', mono: '#12' },
];

export function ExampleChips({ cpu = CEREBR }: { cpu?: string }) {
  return (
    <div className="chips">
      {EXAMPLE_CHIPS.map(c => (
        <a key={c.mono} className="chip" href={toHash({ cpu, id: c.id, vs: c.vs, view: c.view })}>
          <span className="sq" />
          <span className="mono">{c.mono}</span> {c.label}
        </a>
      ))}
    </div>
  );
}
