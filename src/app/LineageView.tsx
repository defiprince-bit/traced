import type { LoadedIndex } from '../useIndex';
import type { CircuitModel } from './useCircuit';
import { FamilyTree } from './FamilyTree';
import { LineageList } from './LineageList';
import { DetailPanel } from './DetailPanel';
import { circuitName } from '../lib/names';
import { DEFAULT_DOWN, DEFAULT_UP } from '../lib/lineage';

export function LineageView({
  ix, model, list, upDepth, downDepth, onExpandCpu,
}: {
  ix: LoadedIndex; model: CircuitModel; list: boolean;
  upDepth: number; downDepth: number;
  onExpandCpu?: (addr: string) => void;
}) {
  const { cpu, id, cls } = model;
  if (id == null) return null;
  return (
    <div className={`lin-wrap${list ? ' list-on' : ''}`}>
      <FamilyTree
        ix={ix} cpu={cpu} id={id} cls={cls} name={circuitName(cpu, id)}
        upDepth={upDepth} downDepth={downDepth} view="lineage" onExpandCpu={onExpandCpu}
      />
      <LineageList
        ix={ix} cpu={cpu} id={id} cls={cls} group={model.group}
        upDepth={upDepth} downDepth={downDepth} view="lineage" onExpandCpu={onExpandCpu}
      />
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

export function DepthToggle({
  up, down, setUp, setDown,
}: {
  up: number; down: number;
  setUp: (n: number) => void; setDown: (n: number) => void;
}) {
  return (
    <div className="depth-ctl" data-testid="depth-toggle">
      <DepthSeg label="↑" value={up} onChange={setUp} />
      <DepthSeg label="↓" value={down} onChange={setDown} />
    </div>
  );
}

function DepthSeg({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="seg depth">
      <span className="dlab">{label}</span>
      {[1, 2, 3].map(n => (
        <button type="button" key={n} className={value === n ? 'on' : ''} onClick={() => onChange(n)} aria-label={`${label} depth ${n}`}>
          {n}
        </button>
      ))}
    </div>
  );
}

export const DEFAULT_DEPTHS = { up: DEFAULT_UP, down: DEFAULT_DOWN };
