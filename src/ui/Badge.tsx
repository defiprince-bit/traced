import type { CircuitClass } from '../lib/classify';
import { CLASS_LABEL, CLASS_MOD } from '../lib/format';

export function Badge({ cls }: { cls: CircuitClass }) {
  return (
    <span className={`badge ${CLASS_MOD[cls]}`}>
      <span className="pkg" />
      {CLASS_LABEL[cls]}
    </span>
  );
}
