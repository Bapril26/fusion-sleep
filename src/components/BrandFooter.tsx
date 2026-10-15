import { Logo } from './Icon';

/** Shown, centred, at the bottom of every tab and page. */
export function BrandFooter() {
  return (
    <footer className="brand-footer">
      <Logo size={20} />
      <span>Created by <b>Fusion Labs</b></span>
    </footer>
  );
}
