import { LOGO, MARK_SRC } from '../brand';

export function Wordmark({ href, compact, onClick }: { href: string; compact?: boolean; onClick?: () => void }) {
  const mark = LOGO !== 'wordmark' ? MARK_SRC[LOGO] : null;
  return (
    <a className={`wm${mark ? ' with-mark' : ''}`} href={href} aria-label="Traced home" onClick={onClick}>
      {mark && <img src={mark} alt="" width={28} height={28} />}
      <b>Traced</b>
      {!compact && <small>for TapeOut</small>}
    </a>
  );
}
