import { HonestNote } from '../ui/HonestNote';
import { ExampleChips } from '../ui/ExampleChips';
import { Spinner } from '../ui/Spinner';

export function LoadingState({ id }: { id: number }) {
  return (
    <section className="card state" data-testid="loading-state">
      <span className="label">Circuit #{id}</span>
      <Spinner label="Reading X Layer" />
      <p className="foot">Free view calls. Nothing is signed.</p>
    </section>
  );
}

export function NotFoundState({ cpuName, id }: { cpuName: string; id: number }) {
  return (
    <section className="card state">
      <span className="label">Not found</span>
      <h2>No circuit #{id} on {cpuName}.</h2>
      <p>It may not be taped out yet, or it lives on another processor. Check the processor and try again.</p>
      <div className="chips" style={{ justifyContent: 'center' }}><ExampleChips /></div>
    </section>
  );
}

export function ErrorState({ err, onRetry }: { err: string; onRetry: () => void }) {
  const copy = async () => { try { await navigator.clipboard.writeText(err); } catch { /* ignore */ } };
  return (
    <section className="card state">
      <span className="label" style={{ color: 'var(--copy)' }}>Can’t reach X Layer</span>
      <h2>The trace went quiet.</h2>
      <p>Both public RPC endpoints timed out. Nothing was sent or signed, so it’s safe to retry.</p>
      <p className="foot" style={{ color: 'var(--copy)' }}>{err}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-lume" type="button" onClick={onRetry}>Try again</button>
        <button className="btn" type="button" onClick={() => void copy()}>Copy error details</button>
      </div>
      <span className="foot">rpc.xlayer.tech · xlayerrpc.okx.com</span>
    </section>
  );
}

export function FindingsEmpty({ cpuName, id, reason }: { cpuName: string; id: number; reason: string; sphere?: React.ReactNode }) {
  return (
    <div className="empty">
      {/* sphere canvas provided by parent */}
      <span className="label">Copy check · {cpuName} #{id}</span>
      <h2>Nice, no silent copies found.</h2>
      <p>{reason}</p>
    </div>
  );
}

export function EmptyLookup() {
  return (
    <section className="card state">
      <span className="label">New lookup</span>
      <h2>Paste a circuit ID to start a trace.</h2>
      <p>Pick a processor, enter a circuit ID, or try one of the Cerebr examples.</p>
      <div className="chips" style={{ justifyContent: 'center' }}><ExampleChips /></div>
      <div style={{ maxWidth: 520, width: '100%', marginTop: 8 }}><HonestNote /></div>
    </section>
  );
}
