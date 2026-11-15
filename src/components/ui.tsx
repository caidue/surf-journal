import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { scoreColor, SUIT_COLOR, SUIT_LABEL, type Suit, type Suitability } from '../lib/rating';
import { explain, type HourRec, type SpotRec } from '../lib/recommend';
import { SURE_LABEL, type Sureness } from '../lib/confidence';
import { fmtDate, fmtMin } from '../lib/time';
import type { Settings } from '../types';
import { windKind, WIND_LABEL, type Derived } from '../lib/conditions';
import { fmtSurfRange, fmtWind } from '../lib/format';
import { bodyRange } from '../lib/skill';
import { WIND_BG } from './Timeline';
import { Icon } from './icons';

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

/** @param who rating for another level ("Advanced"): "Good for Advanced" instead of "Good for you". */
export function SuitBadge({ status, who }: { status: Suit; who?: string }) {
  return (
    <span className="badge" style={{ color: SUIT_COLOR[status], borderColor: SUIT_COLOR[status] }}>
      {who ? SUIT_LABEL[status].replace(/for you$/, `for ${who}`) : SUIT_LABEL[status]}
    </span>
  );
}

/** Why an hour is (not) right for you: up to three reasons, worst first; size reasons link to your comfort size. */
export function SuitReasons({ suit, own = true }: { suit: Suitability; /** false when rating for another level: no link to your profile. */ own?: boolean }) {
  if (!suit.reasons.length) return null;
  return (
    <ul className="suit-reasons">
      {suit.reasons.map((r) => (
        <li key={r.text} className={r.positive ? 'plus' : `s-${r.status}`}>
          {r.text}
          {own && r.kind === 'size' && !r.positive && (
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
/** `outline`: a hollow arrow (the forecast's 2nd / 3rd swell, so the solid main one stands out). */
export function DirArrow({ from, size = 14, color = 'currentColor', outline }: { from: number | null | undefined; size?: number; color?: string; outline?: boolean }) {
  if (from == null) return null;
  return (
    <svg width={size} height={size} viewBox="-10 -10 20 20" style={{ transform: `rotate(${from + 180}deg)`, flex: 'none' }} aria-hidden>
      <path d="M0 -8 L5 4 L0 1 L-5 4 Z" fill={outline ? 'none' : color} stroke={outline ? color : undefined} strokeWidth={outline ? 1.8 : undefined} strokeLinejoin="round" />
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
  // Explore and the spot card say "Go any time" instead (showEven false); this line is for elsewhere.
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

/**
 * A slider over named steps (e.g. Flat … Bigger) that can stay unset: until you touch it the thumb
 * is faded and rests on `start` (default the middle), and the value reads "Not set"; "clear" unsets it.
 */
export function StepSlider<T extends string>({
  options,
  value,
  onChange,
  label,
  start,
}: {
  options: readonly { id: T; label: string }[];
  value: T | undefined;
  onChange: (v: T | undefined) => void;
  label: string;
  start?: number;
}) {
  const idx = value == null ? -1 : options.findIndex((o) => o.id === value);
  const set = idx >= 0;
  const rest = start != null && start >= 0 && start < options.length ? start : Math.floor((options.length - 1) / 2);
  const pick = (i: number) => onChange(options[i].id);
  return (
    <div className={`step-slider${set ? '' : ' unset'}`}>
      <div className="step-slider-head">
        <strong className="step-val">{set ? options[idx].label : 'Not set'}</strong>
        <button type="button" className="link small" style={{ visibility: set ? 'visible' : 'hidden' }} onClick={() => onChange(undefined)} aria-label={`Clear ${label}`}>
          clear
        </button>
      </div>
      <input
        type="range"
        min={0}
        max={options.length - 1}
        step={1}
        value={set ? idx : rest}
        aria-label={label}
        aria-valuetext={set ? options[idx].label : 'Not set'}
        onPointerDown={() => !set && pick(rest)}
        onKeyDown={() => !set && pick(rest)}
        onChange={(e) => pick(Number(e.target.value))}
      />
      <div className="step-ends muted tiny" aria-hidden>
        <span>{options[0].label}</span>
        <span>{options[options.length - 1].label}</span>
      </div>
    </div>
  );
}

const compass = (deg: number) => ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round((((deg % 360) + 360) % 360) / 45) % 8];

/**
 * One hour's conditions as badges: wave height (wave icon), swell peak period and direction (swell
 * icon, arrow = where it goes), wind speed and direction coloured by kind like the forecast's wind
 * row (offshore green … onshore red). Details in each badge's tooltip.
 */
export function CondBadges({ d, settings }: { d: Derived; settings: Settings }) {
  const k = windKind(d);
  return (
    <div className="cond-badges">
      {d.hb != null && (
        <span className="cbadge" title={`Wave height (face): ${fmtSurfRange(d.hb, settings.heightUnit)}, ${bodyRange(d.hb * 0.8, d.hb * 1.2)}`}>
          <Icon name="wave" size={15} />
          {fmtSurfRange(d.hb, settings.heightUnit)}
        </span>
      )}
      {d.tDom != null && (
        <span className="cbadge" title={`Swell: ${Math.round(d.tDom)} s peak period${d.dirDom != null ? `, from ${compass(d.dirDom)} (${Math.round(d.dirDom)}°)` : ''}`}>
          <Icon name="swell" size={15} />
          {Math.round(d.tDom)} s
          <DirArrow from={d.dirDom} size={12} />
        </span>
      )}
      {d.windSpeed != null && (
        <span
          className="cbadge wind"
          style={k ? { background: WIND_BG[k], borderColor: 'transparent' } : undefined}
          title={`Wind: ${k ? WIND_LABEL[k] : ''} ${fmtWind(d.windSpeed, settings.windUnit)}${d.windDir != null ? `, from ${compass(d.windDir)} (${Math.round(d.windDir)}°)` : ''}`}
        >
          <Icon name="wind" size={15} />
          {fmtWind(d.windSpeed, settings.windUnit)}
          <DirArrow from={d.windDir} size={12} />
        </span>
      )}
    </div>
  );
}

/** The footer line under a recommendation: how sure the app is about this rating (reasons on hover). */
export function SureLine({ sure }: { sure: Sureness }) {
  return (
    <div className="sure-line">
      <span className="muted">Confidence in this rating:</span> <SureBadge sure={sure} />
    </div>
  );
}

/**
 * Everything under a recommendation's conditions, shared by Explore's spot cards and the spot's
 * recommendation card: timing warnings ("!"), suitability reasons (✓ / − / ✕), then one bullet
 * list: the best peak, "other times are about as good" on an even day, the explanation; and the
 * confidence footer. The score already says how good it is, so there's no suitability badge.
 * @param timing the hour is the day's best window (not Now or a chosen time): show timing notes
 */
export function PickDetails({ rec, hour, who, forLevel, timing, dayWord }: { rec: SpotRec; hour: HourRec; who: string; forLevel?: string; timing: boolean; dayWord: string }) {
  const lines = explain(hour, (s) => fmtDate(s.date), forLevel);
  const even = timing && rec.evenDay && hour.score > 0.5;
  return (
    <>
      {timing && <TimingNotes rec={rec} showEven={false} />}
      <SuitReasons suit={hour.suit} own={!forLevel} />
      {(hour.peak || even || lines.length > 0) && (
        <ul className="explain">
          {hour.peak && (
            <li>
              Best for {who}: <strong>{hour.peak.name}</strong>
            </li>
          )}
          {even && <li>Other times {dayWord} are about as good (within half a point).</li>}
          {lines.map((l) => (
            <li key={l.text} className={`x-${l.kind}`}>
              {l.kind === 'history' && (
                <span className="x-icon" aria-hidden>
                  <Icon name="journal" size={13} />
                </span>
              )}
              {l.text}
            </li>
          ))}
        </ul>
      )}
      <SureLine sure={hour.sure} />
    </>
  );
}

/**
 * A small confirm / cancel window over the page (dimmed backdrop). Esc or a tap outside cancels.
 * `danger` colours the confirm button red (e.g. deleting).
 */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', esc);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.style.overflow = overflow;
    };
  }, [onCancel]);
  return createPortal(
    <div className="dialog-backdrop" onClick={onCancel}>
      <div className="dialog confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(e) => e.stopPropagation()}>
        <h3 id="confirm-title">{title}</h3>
        {children && <div className="confirm-body">{children}</div>}
        <div className="row gap dialog-actions">
          <button type="button" className="btn" onClick={onCancel} autoFocus>
            Cancel
          </button>
          <button type="button" className={`btn ${danger ? 'danger-solid' : 'primary'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
