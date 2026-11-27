import { lazy, Suspense, useEffect } from 'react';
import { useIndex } from './useIndex';
import { isAppRoute, useRoute, type AppView } from './route';
import { ACCENT } from './brand';
import { Spinner } from './ui/Spinner';

const Landing = lazy(() => import('./landing/Landing'));
const AppShell = lazy(() => import('./app/AppShell'));

export default function App() {
  const { ix, err } = useIndex();
  const [route, go] = useRoute();
  const app = isAppRoute(window.location.hash) || route.id != null || (route.view != null);

  useEffect(() => {
    document.documentElement.dataset.accent = ACCENT;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => document.documentElement.classList.toggle('static', reduce.matches || location.hash.includes('static'));
    sync();
    reduce.addEventListener('change', sync);
    if (location.hash.includes('shot')) document.documentElement.classList.add('shot');
    history.scrollRestoration = 'manual';
    return () => reduce.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('landing', !app);
    document.documentElement.classList.toggle('app', app);
    document.title = app
      ? (route.id != null ? `Traced · ${route.id}` : 'Traced · app')
      : 'Traced, for TapeOut: every circuit, traced back to its source';
  }, [app, route.id]);

  if (err) return <p className="state" style={{ color: 'var(--copy)', padding: 40 }}>Could not load index: {err}</p>;
  if (!ix) return <Spinner page label="Loading index…" />;

  return (
    <Suspense fallback={<Spinner page label="Loading…" />}>
      {app
        ? <AppShell ix={ix} route={route} go={go} />
        : <Landing ix={ix} onTrace={(cpu, id, view?: AppView, vs?: number | null) => go({ cpu, id, view: view ?? 'lookup', vs: vs ?? null })} />}
    </Suspense>
  );
}
