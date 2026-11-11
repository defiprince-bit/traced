import { useState } from 'react';
import type { LoadedIndex } from '../useIndex';
import type { CircuitModel } from './useCircuit';
import { RadialLineage, type LineageMode } from './RadialLineage';
import { LineageList } from './LineageList';
import { DetailPanel } from './DetailPanel';
import { circuitName } from '../lib/names';

export function LineageView({ ix, model, list }: { ix: LoadedIndex; model: CircuitModel; list: boolean }) {
  const { cpu, id, cls, parents, children, group } = model;
  const [mode, setMode] = useState<LineageMode>('uses');
  if (id == null) return null;
  return (
    <div className={`lin-wrap${list ? ' list-on' : ''}`}>
      <RadialLineage ix={ix} cpu={cpu} id={id} cls={cls} name={circuitName(cpu, id)} parents={parents} children={children} group={group} mode={mode} onMode={setMode} />
      <LineageList ix={ix} cpu={cpu} id={id} cls={cls} parents={parents} children={children} group={group} mode={mode} onMode={setMode} />
      <DetailPanel ix={ix} model={model} />
    </div>
  );
}

export function LineageToggle({ list, setList }: { list: boolean; setList: (v: boolean) => void }) {
  return (
    <div className="seg views">
      <button type="button" className={list ? '' : 'on'} onClick={() => setList(false)}>Radial</button>
      <button type="button" className={list ? 'on' : ''} onClick={() => setList(true)}>List</button>
    </div>
  );
}
