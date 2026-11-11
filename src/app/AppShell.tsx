import { useEffect, useState } from 'react';
import type { LoadedIndex } from '../useIndex';
import { toHash, type AppView, type Route } from '../route';
import { Wordmark } from '../ui/Wordmark';
import { LookupBar } from '../ui/LookupBar';
import { IconHome, IconLookup, IconLineage, IconCopies, IconReplay, IconHonesty } from '../ui/icons';
import { short } from '../lib/format';
import { useCircuit } from './useCircuit';
import { LookupView } from './LookupView';
import { LineageView, LineageToggle } from './LineageView';
import { CopyView } from './CopyView';
import { ReplayView } from './ReplayView';
import { LoadingState, NotFoundState, ErrorState, EmptyLookup } from './States';

function defaultView(route: Route, twinCount: number): AppView {
  if (route.view) return route.view;
  if (route.vs != null && twinCount > 0) return 'copy';
  return 'lookup';
}

const VIEW_TITLE: Record<AppView, string> = {
  lookup: 'Lookup',
  lineage: 'Lineage',
  copy: 'Copy check',
  replay: 'Replay',
};

export default function AppShell({ ix, route, go }: { ix: LoadedIndex; route: Route; go: (r: Partial<Route>) => void }) {
  const model = useCircuit(ix, route);
  const twinCount = model.group ? model.group.members.length - 1 : 0;
  const view = defaultView(route, twinCount);
  const [list, setList] = useState(false);
  const cpu = route.cpu;
  const rec = ix.cpus.find(c => c.a === cpu);
  const cpuName = ix.cpuName(cpu);
  const symbol = rec?.y ?? '';

  useEffect(() => {
    document.documentElement.classList.add('app');
    document.documentElement.classList.remove('landing');
    return () => { document.documentElement.classList.remove('app'); };
  }, []);

  const href = (v: AppView, id = route.id, vs = route.vs) => toHash({ cpu, id, vs, view: v });
  const onTrace = (c: string, id: number) => go({ cpu: c, id, vs: null, view: 'lookup' });

  const nav = (
    <>
      <a className={`navi${view === 'lookup' ? ' on' : ''}`} href={href('lookup')} data-v="lookup"><IconLookup />Lookup</a>
      <a className={`navi${view === 'lineage' ? ' on' : ''}`} href={href('lineage')} data-v="lineage"><IconLineage />Lineage</a>
      <a className={`navi${view === 'copy' ? ' on' : ''}`} href={href('copy')} data-v="copy"><IconCopies />Copy check{twinCount > 0 && <span className="ct">{twinCount}</span>}</a>
      <a className={`navi${view === 'replay' ? ' on' : ''}`} href={href('replay')} data-v="replay"><IconReplay />Replay</a>
    </>
  );

  const title = (
    <h1>
      {VIEW_TITLE[view]}
      {route.id != null && <> <span className="mono">#{route.id}</span></>}
      {view === 'replay' && route.vs != null && <> vs <span className="mono">#{route.vs}</span></>}
    </h1>
  );

  let body: React.ReactNode;
  if (route.id == null) body = <EmptyLookup />;
  else if (model.loading && !model.rec && !model.live) body = <LoadingState id={route.id} />;
  else if (model.notFound) body = <NotFoundState cpuName={cpuName} id={route.id} />;
  else if (model.err && !model.live && !model.rec) body = <ErrorState err={model.err} onRetry={() => go({ ...route })} />;
  else if (view === 'lineage') body = <LineageView ix={ix} model={model} list={list} />;
  else if (view === 'copy') body = <CopyView ix={ix} model={model} />;
  else if (view === 'replay') body = <ReplayView ix={ix} model={model} vs={route.vs} onVs={n => go({ ...route, vs: n, view: 'replay' })} />;
  else body = <LookupView ix={ix} model={model} vs={route.vs} />;

  return (
    <div className="shell">
      <aside className="side" aria-label="App navigation">
        <Wordmark href="#top" />
        <div className="newl">
          <a className="btn btn-lume" href={toHash({ cpu, id: null, vs: null, view: null })}>New lookup</a>
          <a className="btn sq" href={toHash({ cpu, id: null, vs: null, view: null })} aria-label="New lookup"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.6"/></svg></a>
        </div>
        {nav}
        <div className="proc-box">
          <span className="label">Processor</span>
          <b>{cpuName} {symbol && <span className="mono">{symbol}</span>}</b>
          <span className="mono">{short(cpu, 6)}</span>
        </div>
        <div className="bottom">
          <a className="navi" href="#honesty"><IconHonesty />What we can’t see</a>
          <div className="live"><i />X Layer · read-only</div>
        </div>
      </aside>
      <header className="mtop"><Wordmark href="#top" compact /><span className="ro"><i />Read-only</span></header>
      <main className="main" id="main">
        <div className="topb">
          <div className="crumb"><IconHome /><span>›</span><span>{VIEW_TITLE[view]}</span>{route.id != null && <><span>›</span><span className="mono">{cpuName} #{route.id}</span></>}</div>
        </div>
        <div className="titlerow">
          {title}
          {view === 'lineage' && <LineageToggle list={list} setList={setList} />}
          <div className="r"><LookupBar ix={ix} cpu={cpu} id={route.id} onTrace={onTrace} /></div>
        </div>
        {model.err && model.rec && <p className="foot" style={{ color: 'var(--copy)' }}>Live read failed: {model.err}. Showing index data.</p>}
        {body}
      </main>
      <nav className="tabbar" aria-label="App">
        <a className={view === 'lookup' ? 'on' : ''} href={href('lookup')} data-v="lookup"><IconLookup />Lookup</a>
        <a className={view === 'lineage' ? 'on' : ''} href={href('lineage')} data-v="lineage"><IconLineage />Lineage</a>
        <a className={view === 'copy' ? 'on' : ''} href={href('copy')} data-v="copy"><IconCopies />Copies</a>
        <a className={view === 'replay' ? 'on' : ''} href={href('replay')} data-v="replay"><IconReplay />Replay</a>
      </nav>
    </div>
  );
}
