import { describe, expect, it } from 'vitest';
import { isMissingCircuitError, missingCircuitMessage } from '../src/lib/xlayer';

describe('isMissingCircuitError', () => {
  it('matches the empty-netlist and normalized messages', () => {
    expect(isMissingCircuitError(new Error(missingCircuitMessage(39)))).toBe(true);
    expect(isMissingCircuitError(new Error('No circuit #999999 on this CPU (empty netlist).'))).toBe(true);
  });

  it('matches a viem revert whose reason is "no circuit"', () => {
    const e = {
      shortMessage: 'The contract function "netlist" reverted with the following reason: no circuit',
      message: 'The contract function "netlist" reverted with the following reason: no circuit',
    };
    expect(isMissingCircuitError(e)).toBe(true);
  });

  it('does not treat an RPC timeout or network failure as a missing circuit', () => {
    expect(isMissingCircuitError(new Error('The request timed out.'))).toBe(false);
    expect(isMissingCircuitError({ shortMessage: 'HTTP request failed', message: 'Failed to fetch' })).toBe(false);
    expect(isMissingCircuitError(new Error('Both public RPC endpoints timed out.'))).toBe(false);
  });
});
