import { Link } from 'react-router-dom';

export function BrandMark({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="brand brand-lockup landing-brand">
      <img src="/WMA_Icon.png" alt="" width="36" height="36" />
      <span>WhereMyApplication</span>
    </Link>
  );
}
