/** Single switch for accent and logo. Douglas is choosing; leave defaults until he says otherwise. */
export type Accent = 'lume' | 'orig';
/** Default: acid green #C8FF6A. Set to 'orig' to use gold as the primary accent. */
export const ACCENT: Accent = 'lume';

export type LogoVariant = 'wordmark' | 'a' | 'b' | 'c';
/** Default: placeholder wordmark only. Marks A/B/C are in /brand/mark-*.svg. */
export const LOGO: LogoVariant = 'wordmark';

export const MARK_SRC: Record<Exclude<LogoVariant, 'wordmark'>, string> = {
  a: `${import.meta.env.BASE_URL}brand/mark-a.svg`,
  b: `${import.meta.env.BASE_URL}brand/mark-b.svg`,
  c: `${import.meta.env.BASE_URL}brand/mark-c.svg`,
};
