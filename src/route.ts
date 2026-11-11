import { useEffect, useState } from 'react';

export const CEREBR = '0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff';

export interface Route { cpu: string; id: number | null; vs: number | null }

export function parseHash(h: string): Route {
  // #/<cpu>/<id>?vs=<id>
  const m = h.replace(/^#\/?/, '').match(/^(0x[0-9a-fA-F]{40})(?:\/(\d+))?(?:\?vs=(\d+))?/);
  if (!m) return { cpu: CEREBR, id: null, vs: null };
  return { cpu: m[1].toLowerCase(), id: m[2] ? Number(m[2]) : null, vs: m[3] ? Number(m[3]) : null };
}

export const toHash = (r: Route) => `#/${r.cpu}${r.id != null ? `/${r.id}` : ''}${r.vs != null ? `?vs=${r.vs}` : ''}`;

export function useRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return [route, (r: Route) => { window.location.hash = toHash(r); }];
}
