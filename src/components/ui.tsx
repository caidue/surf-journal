import type { ReactNode } from 'react';
import type { Level } from '../types';
import { LEVELS } from '../lib/rating';
import { useMediaQuery } from '../hooks';
import { scoreColor, SUIT_COLOR, type Suit } from '../lib/rating';

export function Chips<T extends string>({
  options,
  value,
  onChange,
  multi,
  small,
}: {
  options: { id: T; label: string }[];
  value: T | T[] | null | undefined;
  onChange: (v: any) => void;
  multi?: boolean;
  small?: boolean;
}) {
  const sel = (id: T) => (multi ? (value as T[] | undefined)?.includes(id) : value === id);
  return (
    <div className={`chips${small ? ' small' : ''}`} role={multi ? 'group' : 'radiogroup'}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={`chip${sel(o.id) ? ' on' : ''}`}
          aria-pressed={sel(o.id)}
          onClick={() => {
            if (multi) {
              const arr = (value as T[] | undefined) ?? [];
              onChange(arr.includes(o.id) ? arr.filter((x) => x !== o.id) : [...arr, o.id]);
            } else onChange(value === o.id ? null : o.id);
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="segmented" role="radiogroup">
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} className={value === o.id ? 'on' : ''} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ScoreBadge({ score, size = 'md', title }: { score: number | null | undefined; size?: 'sm' | 'md' | 'lg'; title?: string }) {
  return (
    <span className={`score score-${size}`} style={{ background: scoreColor(score) }} title={title}>
      {score == null ? '–' : score.toFixed(1)}
    </span>
  );
}

export function SuitBadge({ status }: { status: Suit }) {
  const label = { good: 'Good for you', ok: 'OK for you', challenging: 'Challenging', unsuitable: 'Not for your level' }[status];
  return (
    <span className="badge" style={{ color: SUIT_COLOR[status], borderColor: SUIT_COLOR[status] }}>
      {label}
    </span>
  );
}

export function Card({ children, className = '', ...rest }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}

/** Small arrow pointing where the swell/wind is GOING (direction "from" + 180). */
export function DirArrow({ from, size = 14, color = 'currentColor' }: { from: number | null | undefined; size?: number; color?: string }) {
  if (from == null) return null;
  return (
    <svg width={size} height={size} viewBox="-10 -10 20 20" style={{ transform: `rotate(${from + 180}deg)`, flex: 'none' }} aria-hidden>
      <path d="M0 -8 L5 4 L0 1 L-5 4 Z" fill={color} />
    </svg>
  );
}

export function Sparkline({ values, color = '#0ea5e9', width = 90, height = 26 }: { values: (number | null)[]; color?: string; width?: number; height?: number }) {
  const pts = values.map((v, i) => (v == null ? null : [i, v] as const)).filter(Boolean) as [number, number][];
  if (pts.length < 2) return <svg width={width} height={height} />;
  const x0 = pts[0][0];
  const x1 = pts[pts.length - 1][0];
  const sx = (x: number) => ((x - x0) / Math.max(1, x1 - x0)) * (width - 2) + 1;
  const sy = (v: number) => height - 2 - ((v - 1) / 9) * (height - 4);
  return (
    <svg width={width} height={height} aria-hidden>
      <rect x={0} y={0} width={width} height={height} rx={4} fill="#f1f5f9" />
      <polyline points={pts.map(([x, v]) => `${sx(x)},${sy(v)}`).join(' ')} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    </svg>
  );
}

/** Error / offline / "showing saved forecast" line above conditions. */
export function ConditionsStatus({ error, offline, savedAt, onRetry }: { error: string | null; offline: boolean; savedAt: number | null; onRetry: () => void }) {
  if (error && offline)
    return (
      <div className="alert info">
        You're offline and there's no saved forecast for these spots yet. Open the app once with a connection and it keeps the next three days.{' '}
        <button className="link" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  if (error)
    return (
      <div className="alert">
        Couldn't load conditions: {error}{' '}
        <button className="link" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  if (savedAt)
    return (
      <div className="alert info">
        Offline: showing the forecast saved {new Date(savedAt).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}.{' '}
        <button className="link" onClick={onRetry}>
          Refresh
        </button>
      </div>
    );
  return null;
}

const LEVEL_LABELS = LEVELS.map((l) => ({ id: l, label: l[0].toUpperCase() + l.slice(1) }));

/** Surf level: segmented buttons on wide screens, a native picker on phones (it never wraps). */
export function LevelPicker({ value, onChange, label = 'Your level' }: { value: Level; onChange: (l: Level) => void; label?: string }) {
  const phone = useMediaQuery('(max-width: 600px)');
  return phone ? (
    <select className="level-select" value={value} onChange={(e) => onChange(e.target.value as Level)} aria-label={label}>
      {LEVEL_LABELS.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  ) : (
    <Segmented options={LEVEL_LABELS} value={value} onChange={onChange} />
  );
}
