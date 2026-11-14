import type { ReactNode } from 'react';
import { scoreColor, SUIT_COLOR, SUIT_LABEL, type Suit, type Suitability } from '../lib/rating';
import type { SpotRec } from '../lib/recommend';
import { SURE_LABEL, type Sureness } from '../lib/confidence';
import { fmtMin } from '../lib/time';

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

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string; disabled?: boolean; title?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="segmented" role="radiogroup">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          className={value === o.id ? 'on' : ''}
          disabled={o.disabled}
          title={o.title}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Fixed bar at the bottom of the screen for a page's main actions (always visible). */
export function ActionBar({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <div className="action-bar" role="region" aria-label="Actions">
      <div className="action-bar-inner">
        {note && <span className="action-note">{note}</span>}
        <div className="action-buttons">{children}</div>
      </div>
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
  return (
    <span className="badge" style={{ color: SUIT_COLOR[status], borderColor: SUIT_COLOR[status] }}>
      {SUIT_LABEL[status]}
    </span>
  );
}

/** Why an hour is (not) right for you: up to three reasons, worst first; size reasons link to your comfort size. */
export function SuitReasons({ suit }: { suit: Suitability }) {
  if (!suit.reasons.length) return null;
  return (
    <ul className="suit-reasons">
      {suit.reasons.map((r) => (
        <li key={r.text} className={r.positive ? 'plus' : `s-${r.status}`}>
          {r.text}
          {r.kind === 'size' && !r.positive && (
            <>
              {' '}
              <a href="#/surfing?step=comfort" className="small">
                Edit comfort size
              </a>
            </>
          )}
        </li>
      ))}
    </ul>
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

/** "Go before the wind turns", "the models disagree", "fairly even day": what the best window can't say by itself. */
export function TimingNotes({ rec, showEven = true }: { rec: SpotRec; showEven?: boolean }) {
  const notes: string[] = [];
  if (rec.windTurn != null) notes.push(`The wind turns onshore around ${fmtMin(rec.windTurn)}: go early.`);
  if (rec.windUnsure) notes.push('The wind models disagree on the direction then: check the wind before you go.');
  if (showEven && rec.evenDay) notes.push('Fairly even day: no time clearly stands out.');
  if (!notes.length) return null;
  return (
    <ul className="timing-notes">
      {notes.map((n) => (
        <li key={n}>{n}</li>
      ))}
    </ul>
  );
}

/** How sure the app is about a rating: Reliable / Less certain / Rough guide, with the reasons on hover. */
export function SureBadge({ sure }: { sure: Sureness }) {
  if (sure.withheld) return <span className="sure withheld" title={sure.withheld}>No rating</span>;
  return (
    <span className={`sure ${sure.level}`} title={`${SURE_LABEL[sure.level]}: ${sure.reasons.join(', ')}.`}>
      {SURE_LABEL[sure.level]}
    </span>
  );
}
