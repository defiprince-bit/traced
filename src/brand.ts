/** Single switch for accent and logo. Logo is A (via ring), chosen 11 Nov 2026. */
export type Accent = 'lume' | 'orig';
/** Default: acid green #C8FF6A. Set to 'orig' to use gold as the primary accent. */
export const ACCENT: Accent = 'lume';

export type LogoVariant = 'wordmark' | 'a' | 'b' | 'c';
/** Chosen: A (via ring). Marks A/B/C are in /brand/mark-*.svg. */
export const LOGO: LogoVariant = 'a';

export const MARK_SRC: Record<Exclude<LogoVariant, 'wordmark'>, string> = {
  a: `${import.meta.env.BASE_URL}brand/mark-a.svg`,
  b: `${import.meta.env.BASE_URL}brand/mark-b.svg`,
  c: `${import.meta.env.BASE_URL}brand/mark-c.svg`,
};
