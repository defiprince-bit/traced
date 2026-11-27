import { HOME_HASH } from '../route';
import { IconHome } from './icons';

export type HomeButtonVariant = 'nav' | 'bar' | 'tab' | 'crumb';

const CLASS: Record<HomeButtonVariant, string> = {
  nav: 'navi home-btn',
  bar: 'home-btn home-btn-bar',
  tab: 'home-btn home-btn-tab',
  crumb: 'crumb-home',
};

export function HomeButton({ variant = 'nav' }: { variant?: HomeButtonVariant }) {
  return (
    <a className={CLASS[variant]} href={HOME_HASH} aria-label="Home" data-testid={`home-${variant}`}>
      <IconHome />
      <span>Home</span>
    </a>
  );
}
