import { useEffect, useState, type ReactNode } from 'react';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(mq.matches);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return reduced;
}

export function CountUp({ value }: { value: number }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(0);
  const display = reduced ? value : shown;

  useEffect(() => {
    if (reduced) return;
    const start = performance.now();
    const duration = 700;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setShown(Math.round(value * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduced]);

  return <>{display}</>;
}

const MARK_HUES = [230, 262, 188, 199, 28, 330];

export function CompanyMark({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = (parts.slice(0, 2).map((part) => part[0]) || ['?']).join('').toUpperCase() || '?';
  let index = 0;
  for (const char of name) index = (index + char.charCodeAt(0)) % MARK_HUES.length;
  return (
    <span className="co-mark" style={{ background: `hsl(${MARK_HUES[index]} 72% 46%)` }} aria-hidden="true">
      {letters.slice(0, 2)}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  detail,
  action,
}: {
  icon?: ReactNode;
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      {icon ? <span className="empty-icon">{icon}</span> : null}
      <strong>{title}</strong>
      <p>{detail}</p>
      {action}
    </div>
  );
}

export function ScoreRing({ score }: { score: number }) {
  const safe = Math.max(0, Math.min(100, score));
  const radius = 46;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (safe / 100) * circ;
  return (
    <div className="score-ring" role="img" aria-label={`Match score ${safe} out of 100`}>
      <svg viewBox="0 0 120 120">
        <circle className="ring-track" cx="60" cy="60" r={radius} />
        <circle
          className="ring-value"
          cx="60"
          cy="60"
          r={radius}
          style={{ ['--ring-circ' as string]: circ, ['--ring-offset' as string]: offset }}
        />
      </svg>
      <div className="score-ring-label">
        <strong>{safe}</strong>
        <span>out of 100</span>
      </div>
    </div>
  );
}
