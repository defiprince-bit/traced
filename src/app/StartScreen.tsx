import type { LoadedIndex } from '../useIndex';
import { LookupBar } from '../ui/LookupBar';
import { HonestNote } from '../ui/HonestNote';
import { startDemos } from '../lib/demos';
import { toHash } from '../route';

export function StartScreen({
  ix, cpu, onTrace,
}: {
  ix: LoadedIndex;
  cpu: string;
  onTrace: (cpu: string, id: number) => void;
}) {
  const cards = startDemos(ix);
  return (
    <section className="start" data-testid="start-screen">
      <div className="lede">
        <span className="label">New lookup</span>
        <h2>Pick a circuit, or paste an ID.</h2>
        <p>No wallet. No sign-up. Traced only reads X Layer — nothing is signed or sent.</p>
      </div>
      <LookupBar ix={ix} cpu={cpu} id={null} onTrace={onTrace} size="lg" />
      {cards.length > 0 && (
        <div className="demo-grid" data-testid="demo-cards">
          {cards.map(c => (
            <a
              key={c.key}
              className="demo-card"
              href={toHash({ cpu: c.cpu, id: c.id, vs: c.vs, view: c.view })}
              data-testid={`demo-${c.key}`}
            >
              <span className="label"><span className="mono">{c.kicker}</span></span>
              <b>{c.title}</b>
              <p>{c.fact}</p>
              <span className="go">{c.go} →</span>
            </a>
          ))}
        </div>
      )}
      <div className="start-note"><HonestNote /></div>
    </section>
  );
}
