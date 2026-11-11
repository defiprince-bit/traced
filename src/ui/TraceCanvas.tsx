import { useEffect, useRef } from 'react';
import { TraceScene, type TraceOpt, type Cube } from '../cubes';

export function TraceCanvas({
  opt, className, hidden, role, label, onScene,
}: {
  opt: TraceOpt;
  className?: string;
  hidden?: boolean;
  role?: string;
  label?: string;
  onScene?: (s: TraceScene | null) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const scene = useRef<TraceScene | null>(null);
  // Recreate only when the canvas mounts; callers mutate flow/state on the instance.
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const s = new TraceScene(cv, opt);
    scene.current = s;
    onScene?.(s);
    return () => { s.destroy(); scene.current = null; onScene?.(null); };
    // opt is captured at mount; parent should remount with a key if cubes change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <canvas
      ref={ref}
      className={className}
      aria-hidden={hidden ? true : undefined}
      role={role}
      aria-label={label}
    />
  );
}

export type { Cube, TraceScene };
