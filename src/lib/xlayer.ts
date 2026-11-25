// Read-only X Layer access. Every call here is eth_call (view). Nothing is signed or sent.
import { createPublicClient, defineChain, fallback, http, keccak256 } from 'viem';

export const xlayer = defineChain({
  id: 196,
  name: 'X Layer',
  nativeCurrency: { name: 'OKB', symbol: 'OKB', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.xlayer.tech', 'https://xlayerrpc.okx.com'] } },
  blockExplorers: { default: { name: 'OKX Explorer', url: 'https://www.okx.com/web3/explorer/xlayer' } },
});

// Public RPC caps JSON-RPC batches at 10.
export const client = createPublicClient({
  chain: xlayer,
  transport: fallback([
    http('https://rpc.xlayer.tech', { batch: { batchSize: 10, wait: 16 } }),
    http('https://xlayerrpc.okx.com', { batch: { batchSize: 10, wait: 16 } }),
  ]),
});

export const circuitsAbi = [
  { type: 'function', name: 'netlist', stateMutability: 'view', inputs: [{ name: 'id', type: 'uint256' }], outputs: [{ type: 'bytes' }] },
  { type: 'function', name: 'circuitInfo', stateMutability: 'view', inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [{ name: 'nIn', type: 'uint32' }, { name: 'nOut', type: 'uint32' }, { name: 'nState', type: 'uint32' }, { name: 'gateCount', type: 'uint32' }] },
  { type: 'function', name: 'ownerOf', stateMutability: 'view', inputs: [{ name: 'id', type: 'uint256' }], outputs: [{ type: 'address' }] },
  { type: 'function', name: 'nextId', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  // selector 0x934d06ea
  { type: 'function', name: 'eval', stateMutability: 'view', inputs: [{ name: 'id', type: 'uint256' }, { name: 'inputs', type: 'bytes' }], outputs: [{ type: 'bytes' }] },
  // selector 0xe8281a1a
  { type: 'function', name: 'step', stateMutability: 'view', inputs: [{ name: 'id', type: 'uint256' }, { name: 'state', type: 'bytes' }, { name: 'inputs', type: 'bytes' }], outputs: [{ name: 'newState', type: 'bytes' }, { name: 'outputs', type: 'bytes' }] },
] as const;

export interface LiveCircuit {
  netlist: `0x${string}`;
  hash: `0x${string}`;
  nIn: number; nOut: number; nState: number; gateCount: number;
  owner: string | null;
}


function errText(e: unknown): string {
  if (e && typeof e === 'object') {
    const o = e as { shortMessage?: string; details?: string; message?: string; reason?: string };
    return [o.shortMessage, o.details, o.reason, o.message].filter(Boolean).join(' ');
  }
  return String(e);
}

/** True when the processor answered, but this id is not taped out. */
export function isMissingCircuitError(e: unknown): boolean {
  const m = errText(e);
  if (/No circuit #\d+/.test(m)) return true;
  if (/timeout|TIMED_OUT|failed to fetch|network|HTTP/i.test(m) && !/\bno circuit\b/i.test(m)) return false;
  return /\bno circuit\b/i.test(m) || /empty netlist/i.test(m);
}

export function missingCircuitMessage(id: number): string {
  return `No circuit #${id} on this CPU.`;
}

export async function readCircuit(cpu: `0x${string}`, id: number): Promise<LiveCircuit> {
  const big = BigInt(id);
  try {
    const [nl, info, owner] = await Promise.all([
      client.readContract({ address: cpu, abi: circuitsAbi, functionName: 'netlist', args: [big] }),
      client.readContract({ address: cpu, abi: circuitsAbi, functionName: 'circuitInfo', args: [big] }),
      client.readContract({ address: cpu, abi: circuitsAbi, functionName: 'ownerOf', args: [big] }).catch(() => null),
    ]);
    if (nl === '0x') throw new Error(missingCircuitMessage(id));
    const [nIn, nOut, nState, gateCount] = info;
    return { netlist: nl, hash: keccak256(nl), nIn, nOut, nState, gateCount, owner: owner ? owner.toLowerCase() : null };
  } catch (e) {
    if (isMissingCircuitError(e)) throw new Error(missingCircuitMessage(id));
    throw e;
  }
}

export async function nextId(cpu: `0x${string}`): Promise<number> {
  return Number(await client.readContract({ address: cpu, abi: circuitsAbi, functionName: 'nextId' }));
}

/** Free combinational run. View call: leaves no trace on-chain and costs nothing. */
export function evalCircuit(cpu: `0x${string}`, id: number, inputs: `0x${string}`): Promise<`0x${string}`> {
  return client.readContract({ address: cpu, abi: circuitsAbi, functionName: 'eval', args: [BigInt(id), inputs] });
}

/** Free sequential step. View call: leaves no trace on-chain and costs nothing. */
export async function stepCircuit(
  cpu: `0x${string}`,
  id: number,
  state: `0x${string}`,
  inputs: `0x${string}`,
): Promise<{ newState: `0x${string}`; outputs: `0x${string}` }> {
  const [newState, outputs] = await client.readContract({
    address: cpu,
    abi: circuitsAbi,
    functionName: 'step',
    args: [BigInt(id), state, inputs],
  });
  return { newState, outputs };
}

export const explorerTx = (tx: string) => `https://www.okx.com/web3/explorer/xlayer/tx/${tx}`;
export const explorerAddr = (a: string) => `https://www.okx.com/web3/explorer/xlayer/address/${a}`;
