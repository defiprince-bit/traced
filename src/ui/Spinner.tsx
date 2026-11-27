export function Spinner({
  label,
  size = 40,
  page = false,
}: {
  label?: string;
  size?: number;
  page?: boolean;
}) {
  return (
    <div
      className={`spinner${page ? ' spinner-page' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={label ?? 'Loading'}
      data-testid="spinner"
    >
      <span className="spinner-wrap" style={{ width: size, height: size }}>
        <svg className="spinner-ring" viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
          <circle className="spinner-track" cx="20" cy="20" r="16" fill="none" />
          <circle className="spinner-arc" cx="20" cy="20" r="16" fill="none" />
        </svg>
      </span>
      {label && <p className="spinner-label">{label}</p>}
    </div>
  );
}
