export function HonestNote({ compact: _compact }: { compact?: boolean } = {}) {
  return (
    <div className="honest">
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="4" y="4" width="12" height="12" stroke="currentColor" strokeWidth="1.5" /><path d="M4.5 4.5l11 11" stroke="currentColor" strokeWidth="1.5" /></svg>
      <span>Replay uses free <span className="mono">eval()</span> or <span className="mono">step()</span> view calls. They leave nothing on-chain, so nobody, including us, can count who uses a circuit. Traced only shows what’s written: REFs, netlist bytes, tape-out txs.</span>
    </div>
  );
}
