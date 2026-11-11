const TEXT = {
  orig: 'Likely original',
  copy: 'Silent copy',
  ok: 'No twins',
  ex: 'Example data · Traced index',
  match: 'match',
} as const;

export function VerdictTag({ kind, children }: { kind: 'orig' | 'copy' | 'ok' | 'ex'; children?: React.ReactNode }) {
  return <span className={`tag ${kind}`}>{children ?? TEXT[kind]}</span>;
}
