import { describe, expect, it } from 'vitest';
import { CEREBR, HOME_HASH, parseHash, toHash } from '../src/route';

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

import { isAppRoute } from '../src/route';

describe('start-screen routing', () => {
  it('treats #/<cpu> with no id as an app route (the first-run screen)', () => {
    expect(isAppRoute(`#/${CEREBR}`)).toBe(true);
    expect(isAppRoute(`#/${CEREBR}/`)).toBe(true);
    expect(parseHash(`#/${CEREBR}`)).toEqual({ cpu: CEREBR, id: null, vs: null, view: null, landing: null });
    expect(toHash({ cpu: CEREBR, id: null, vs: null, view: null })).toBe(`#/${CEREBR}`);
  });
  it('keeps landing hashes off the app route', () => {
    expect(isAppRoute('')).toBe(false);
    expect(isAppRoute('#story')).toBe(false);
    expect(isAppRoute('#top')).toBe(false);
  });
  it('home hash clears lookup state and is not an app route', () => {
    expect(HOME_HASH).toBe('#top');
    expect(isAppRoute(HOME_HASH)).toBe(false);
    expect(parseHash(HOME_HASH)).toEqual({ cpu: CEREBR, id: null, vs: null, view: null, landing: 'top' });
  });
  it('still parses a circuit id after the start-screen form', () => {
    expect(parseHash(`#/${CEREBR}/14?view=replay`)).toEqual({
      cpu: CEREBR, id: 14, vs: null, view: 'replay', landing: null,
    });
    expect(toHash({ cpu: CEREBR, id: 14, vs: 35, view: 'replay' })).toBe(`#/${CEREBR}/14?vs=35&view=replay`);
  });
});
