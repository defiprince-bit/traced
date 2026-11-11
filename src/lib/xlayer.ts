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
] as const;

export interface LiveCircuit {
  netlist: `0x${string}`;
  hash: `0x${string}`;
  nIn: number; nOut: number; nState: number; gateCount: number;
  owner: string | null;
}

export async function readCircuit(cpu: `0x${string}`, id: number): Promise<LiveCircuit> {
  const big = BigInt(id);
  const [nl, info, owner] = await Promise.all([
    client.readContract({ address: cpu, abi: circuitsAbi, functionName: 'netlist', args: [big] }),
    client.readContract({ address: cpu, abi: circuitsAbi, functionName: 'circuitInfo', args: [big] }),
    client.readContract({ address: cpu, abi: circuitsAbi, functionName: 'ownerOf', args: [big] }).catch(() => null),
  ]);
  if (nl === '0x') throw new Error(`No circuit #${id} on this CPU (empty netlist).`);
  const [nIn, nOut, nState, gateCount] = info;
  return { netlist: nl, hash: keccak256(nl), nIn, nOut, nState, gateCount, owner: owner ? owner.toLowerCase() : null };
}

export async function nextId(cpu: `0x${string}`): Promise<number> {
  return Number(await client.readContract({ address: cpu, abi: circuitsAbi, functionName: 'nextId' }));
}

/** Free combinational run. View call: leaves no trace on-chain and costs nothing. */
export function evalCircuit(cpu: `0x${string}`, id: number, inputs: `0x${string}`): Promise<`0x${string}`> {
  return client.readContract({ address: cpu, abi: circuitsAbi, functionName: 'eval', args: [BigInt(id), inputs] });
}

export const explorerTx = (tx: string) => `https://www.okx.com/web3/explorer/xlayer/tx/${tx}`;
export const explorerAddr = (a: string) => `https://www.okx.com/web3/explorer/xlayer/address/${a}`;
