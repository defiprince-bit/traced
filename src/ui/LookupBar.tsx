import { useEffect, useMemo, useState } from 'react';
import type { LoadedIndex } from '../useIndex';
import { CEREBR } from '../route';

export function LookupBar({
  ix, cpu, id, onTrace, size = 'md',
}: {
  ix: LoadedIndex;
  cpu: string;
  id: number | string | null;
  onTrace: (cpu: string, id: number) => void;
  size?: 'md' | 'lg';
}) {
  const [c, setC] = useState(cpu);
  const [v, setV] = useState(id != null && id !== '' ? String(id) : '');
  useEffect(() => { setC(cpu); setV(id != null && id !== '' ? String(id) : ''); }, [cpu, id]);
  const cpus = useMemo(
    () => [...ix.cpus].sort((a, b) => (a.a === CEREBR ? -1 : b.a === CEREBR ? 1 : a.n.localeCompare(b.n))),
    [ix],
  );
  const rec = cpus.find(x => x.a === c) ?? cpus[0];
  return (
    <form
      className={`lookup${size === 'lg' ? ' lookup-lg' : ''}`}
      onSubmit={e => { e.preventDefault(); const n = parseInt(v, 10); if (n > 0) onTrace(c, n); }}
      aria-label="Look up a circuit"
    >
      <label className="proc">
        <span className="label">Processor</span>
        <span className="v">
          <select className="proc-sel" value={c} onChange={e => setC(e.target.value)} data-testid="cpu" aria-label="Processor">
            {cpus.map(p => (
              <option key={p.a} value={p.a}>{p.n}</option>
            ))}
          </select>
          <span className="mono">{rec?.y}</span>
          <svg className="chev" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" stroke="currentColor" strokeWidth="1.4" /></svg>
        </span>
      </label>
      <label className="cid">
        <span className="hash">#</span>
        <input
          inputMode="numeric"
          value={v}
          onChange={e => setV(e.target.value.replace(/\D/g, ''))}
          placeholder="Circuit ID, e.g. 5"
          aria-label="Circuit ID"
          data-testid="id"
        />
      </label>
      <button className={`btn btn-lume${size === 'lg' ? ' btn-lg' : ''}`} type="submit">
        {size === 'lg' ? <>Trace it <span className="kbd">⏎</span></> : <>Trace <span className="kbd">⏎</span></>}
      </button>
    </form>
  );
}
