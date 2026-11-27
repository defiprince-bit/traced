import { useEffect, useState } from 'react';

export const CEREBR = '0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff';

/** Landing hash. Clears lookup state and is not an app route. */
export const HOME_HASH = '#top';

export type AppView = 'lookup' | 'lineage' | 'copy' | 'replay';

export interface Route {
  cpu: string;
  id: number | null;
  vs: number | null;
  view: AppView | null;
  /** Landing section hash (#story) or shot helpers; ignored on app routes. */
  landing: string | null;
}

const VIEWS = new Set<AppView>(['lookup', 'lineage', 'copy', 'replay']);

export function parseHash(h: string): Route {
  const raw = h.replace(/^#/, '');
  // App route: /<cpu>/<id>?vs=&view=
  const m = raw.match(/^\/?(0x[0-9a-fA-F]{40})(?:\/(\d+))?(?:\?([^#]*))?/);
  if (m) {
    const q = new URLSearchParams(m[3] || '');
    const viewRaw = q.get('view');
    const view = viewRaw && VIEWS.has(viewRaw as AppView) ? viewRaw as AppView : null;
    const vs = q.get('vs');
    return {
      cpu: m[1].toLowerCase(),
      id: m[2] ? Number(m[2]) : null,
      vs: vs && /^\d+$/.test(vs) ? Number(vs) : null,
      view,
      landing: null,
    };
  }
  // Landing: empty, #story, #cta, #f=hero:0, #static, etc.
  const landing = raw.split('&')[0] || '';
  return { cpu: CEREBR, id: null, vs: null, view: null, landing: landing || null };
}

export function toHash(r: Pick<Route, 'cpu' | 'id' | 'vs' | 'view'>): string {
  if (r.id == null && !r.view) return `#/${r.cpu}`;
  const q = new URLSearchParams();
  if (r.vs != null) q.set('vs', String(r.vs));
  if (r.view) q.set('view', r.view);
  const qs = q.toString();
  return `#/${r.cpu}${r.id != null ? `/${r.id}` : ''}${qs ? `?${qs}` : ''}`;
}

export function isAppRoute(h: string): boolean {
  return /^#\/?0x[0-9a-fA-F]{40}/.test(h);
}

export function useRoute(): [Route, (r: Partial<Route> & { cpu?: string }) => void] {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return [route, (r) => {
    const next: Route = { ...route, ...r, cpu: (r.cpu ?? route.cpu).toLowerCase() };
    window.location.hash = toHash(next);
  }];
}
