import { describe, expect, it } from 'vitest';
import { CEREBR, parseHash, toHash } from '../src/route';

describe('hash routes', () => {
  it('parses the existing #/<cpu>/<id>?vs=<id> form', () => {
    expect(parseHash(`#/${CEREBR}/5?vs=4`)).toEqual({ cpu: CEREBR, id: 5, vs: 4, view: null, landing: null });
    expect(parseHash(`#/${CEREBR}/12`)).toEqual({ cpu: CEREBR, id: 12, vs: null, view: null, landing: null });
    expect(toHash({ cpu: CEREBR, id: 5, vs: 4, view: null })).toBe(`#/${CEREBR}/5?vs=4`);
  });
  it('round-trips an optional view param without breaking vs', () => {
    const r = parseHash(`#/${CEREBR}/34?vs=4&view=copy`);
    expect(r).toEqual({ cpu: CEREBR, id: 34, vs: 4, view: 'copy', landing: null });
    expect(toHash(r)).toBe(`#/${CEREBR}/34?vs=4&view=copy`);
  });
  it('treats landing section hashes as the home route', () => {
    expect(parseHash('')).toMatchObject({ id: null, view: null, cpu: CEREBR });
    expect(parseHash('#story').landing).toBe('story');
    expect(parseHash('#cta').id).toBeNull();
  });
});
