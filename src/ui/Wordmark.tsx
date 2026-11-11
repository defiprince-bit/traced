import { LOGO, MARK_SRC } from '../brand';

export function Wordmark({ href, compact, onClick }: { href: string; compact?: boolean; onClick?: () => void }) {
  const mark = LOGO !== 'wordmark' ? MARK_SRC[LOGO] : null;
  return (
    <a className={`wm${mark ? ' with-mark' : ''}${compact ? ' compact' : ''}`} href={href} aria-label="Traced home" onClick={onClick}>
      {mark && (
        <span
          className="mark"
          aria-hidden="true"
          style={{ WebkitMaskImage: `url("${mark}")`, maskImage: `url("${mark}")` }}
        />
      )}
      <span className="wm-text">
        <b>Traced</b>
        {!compact && <small>for TapeOut</small>}
      </span>
    </a>
  );
}
