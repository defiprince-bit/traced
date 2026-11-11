import type { LoadedIndex } from '../useIndex';
import { num, short } from '../lib/format';
import { HonestNote } from './HonestNote';

export function coverageStats(ix: LoadedIndex) {
  const cpus = ix.cpus;
  const full = cpus.filter(c => c.st === 'scanned');
  const partial = cpus.filter(c => c.st === 'partial');
  const skipped = cpus.filter(c => c.st === 'skipped');
  const withCircuits = cpus.filter(c => c.c > 0);
  const indexed = cpus.reduce((a, c) => a + (c.i ?? 0), 0);
  const onFactory = cpus.reduce((a, c) => a + (c.c ?? 0), 0);
  return { cpus, full, partial, skipped, withCircuits, indexed, onFactory };
}

/** Per-processor coverage for the honesty section and the in-app "What we can’t see" panel. */
export function Coverage({ ix, inApp }: { ix: LoadedIndex; inApp?: boolean }) {
  const s = coverageStats(ix);
  const notable = [...s.partial, ...s.skipped, ...s.full.filter(c => (c.latest != null && c.latest !== c.c) || (c.c ?? 0) > 500)].sort((a, b) => b.c - a.c);
  // Always mention the historically large processors, even when fully scanned.
  const seen = new Set(notable.map(c => c.a));
  for (const c of s.cpus) if ((c.c ?? 0) > 500 && !seen.has(c.a)) notable.push(c);
  const block = num(ix.meta.block);
  return (
    <div className="coverage" data-testid="coverage">
      <p>
        The index is a snapshot at X Layer block <span className="mono">{block}</span>
        {ix.meta.builtAt ? <> · built {new Date(ix.meta.builtAt).toISOString().slice(0, 10)}</> : null}.
        It holds <strong>{num(ix.meta.circuitsIndexed)}</strong> of {num(s.onFactory)} circuits then on the official factory
        ({num(s.full.length)} of {num(s.withCircuits.length)} processors fully scanned
        {s.partial.length ? `, ${s.partial.length} partial` : ''}
        {s.skipped.length ? `, ${s.skipped.length} not indexed` : ''}).
        REF uses ({num(ix.meta.refEdges)}) and twin groups ({num(ix.meta.twinGroups)}) only count circuits in this snapshot.
      </p>
      {notable.length > 0 && (
        <table className="cov">
          <thead>
            <tr><th>Processor</th><th>Indexed</th><th>At snapshot</th><th>Coverage</th></tr>
          </thead>
          <tbody>
            {notable.map(c => {
              const total = c.c ?? 0;
              const pct = total ? Math.round((c.i / total) * 100) : 100;
              const label = c.st === 'scanned' ? 'full' : c.st === 'partial' ? 'partial' : c.st === 'skipped' ? 'not indexed' : 'empty';
              return (
                <tr key={c.a} data-st={c.st}>
                  <td><b>{c.n}</b> <span className="mono">{short(c.a, 6)}</span></td>
                  <td className="mono">{num(c.i)}</td>
                  <td className="mono">{num(total)}</td>
                  <td>{label}{total ? ` · ${pct}%` : ''}{c.latest != null && c.latest !== c.c ? ` · later head nextId ${num(c.latest)}` : ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <p className="foot">
        Circuits outside the index still load live from a read-only RPC call. Their parents (decoded from the netlist) show up; children and twins among unindexed circuits may be missing.
        {s.cpus.some(c => c.latest != null && c.latest !== c.c) ? ' A later chain head may have more circuits than this snapshot; those are not in the index.' : ''}
      </p>
      {inApp && <HonestNote />}
    </div>
  );
}
