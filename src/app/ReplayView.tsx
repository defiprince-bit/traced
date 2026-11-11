import { useMemo, useState } from 'react';
import type { LoadedIndex } from '../useIndex';
import type { CircuitModel } from './useCircuit';
import { ReplayTable, replayOptions } from './ReplayTable';
import { HonestNote } from '../ui/HonestNote';
import { VerdictTag } from '../ui/VerdictTag';
import { circuitName } from '../lib/names';

export function ReplayView({ ix, model, vs, onVs }: { ix: LoadedIndex; model: CircuitModel; vs: number | null; onVs: (id: number | null) => void }) {
  const { cpu, id, pins, group, parents, silent, isOriginal } = model;
  const options = useMemo(() => replayOptions(ix, cpu, id!, vs, group, parents, pins), [ix, cpu, id, vs, group, parents, pins]);
  const [custom, setCustom] = useState('');
  if (id == null || !pins) return <p className="foot">Waiting for pins…</p>;
  const against = options.find(o => vs != null && o.cpu === cpu && o.id === vs) ?? options[0] ?? null;
  const picked = vs != null;
  const isTwin = !!(group && against && group.members.some((m) => m[0] === against.cpu && m[1] === against.id));
  const isOrig = !!(group?.original && against && against.cpu === group.original[0] && against.id === group.original[1]);
  const note = picked && !isTwin
    ? `you picked${circuitName(against?.cpu ?? cpu, against?.id ?? 0) ? `: ${circuitName(against!.cpu, against!.id)}` : ''}`
    : isOrig ? 'twin · likely original' : isTwin ? 'twin' : undefined;

  return (
    <div className="rp-wrap">
      <section className="card rp-big">
        <div className="card-h"><h2>Truth table</h2><span className="label">{pins.nIn} inputs · {pins.nIn <= 8 ? 1 << pins.nIn : 16} rows · free</span></div>
        <div className="card-b">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <label className="cmp">vs
              <select value={against ? `${against.cpu}:${against.id}` : ''} onChange={e => {
                const [c, i] = e.target.value.split(':');
                if (c === cpu) onVs(Number(i));
              }}>
                <option value="">nothing</option>
                {options.map(o => <option key={`${o.cpu}:${o.id}`} value={`${o.cpu}:${o.id}`}>{o.label}{o.nIn !== pins.nIn || o.nOut !== pins.nOut ? ' (different pins)' : ''}</option>)}
              </select>
            </label>
            <form className="cmp" onSubmit={e => { e.preventDefault(); const n = parseInt(custom, 10); if (n > 0) onVs(n); }}>
              <input inputMode="numeric" value={custom} onChange={e => setCustom(e.target.value.replace(/\D/g, ''))} placeholder="id" aria-label="Compare with circuit ID" style={{ width: 64, border: 0, background: 'transparent', color: 'inherit', font: 'inherit' }} />
              <button className="btn btn-sm" type="submit">Set</button>
            </form>
          </div>
          <ReplayTable
            subject={{ cpu, id, label: `#${id}`, nIn: pins.nIn, nOut: pins.nOut, nState: pins.nState }}
            against={against}
            againstNote={note}
            auto
            big
          />
        </div>
      </section>
      <aside className="card detail">
        <div className="k">
          {silent && !isOriginal && <VerdictTag kind="copy" />}
          {silent && isOriginal && <VerdictTag kind="orig" />}
          <span className="label" style={{ marginLeft: 'auto' }}>{against ? `vs #${against.id}` : 'solo'}</span>
        </div>
        <h3>{against ? 'Compare outputs, row by row.' : 'A free truth table, from eval().'}</h3>
        <p>Every row is one read-only <span className="mono">eval()</span> view call on X Layer. Nothing is signed or sent.</p>
        <HonestNote />
      </aside>
    </div>
  );
}
