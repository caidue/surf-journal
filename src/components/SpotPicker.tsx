import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Spot } from '../types';
import { Icon } from './icons';

/** The value after it has stopped changing for `ms` (typing in a search field, say). */
export function useDebounced<T>(value: T, ms = 180): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Lower case, accents removed: "cotillo" finds "Cotillo", "generoso" finds "Generosa" (an alias). */
const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/**
 * One input to choose a spot: type to search (debounced), or open the full list with the arrow.
 * Keyboard: ↑/↓ to move, Enter to choose, Esc to close. Follows the ARIA combobox pattern.
 */
export default function SpotPicker({ spots, value, onChange, label = 'Spot' }: { spots: Spot[]; value: string; onChange: (id: string) => void; label?: string }) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = spots.find((s) => s.id === value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const q = useDebounced(query);

  const matches = useMemo(() => {
    const words = norm(q).split(/\s+/).filter(Boolean);
    return spots
      .filter((s) => words.every((w) => norm(`${s.name} ${(s.aliases ?? []).join(' ')} ${s.region}`).includes(w)))
      .sort((a, b) => a.region.localeCompare(b.region) || a.name.localeCompare(b.name));
  }, [spots, q]);
  useEffect(() => setActive(0), [q]);

  const choose = (s: Spot) => {
    onChange(s.id);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && matches[active]) {
        e.preventDefault();
        choose(matches[active]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  // Group the visible matches by region for the list.
  let lastRegion = '';

  return (
    <div className="spot-picker">
      <div className={`sp-field${open ? ' open' : ''}`}>
        <Icon name="search" size={18} />
        <input
          ref={inputRef}
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && matches[active] ? `${listId}-${matches[active].id}` : undefined}
          placeholder={selected ? selected.name : 'Search or choose a spot…'}
          value={open ? query : selected?.name ?? ''}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKey}
          autoComplete="off"
          enterKeyHint="go"
        />
        <button
          type="button"
          className="sp-toggle"
          tabIndex={-1}
          aria-label={open ? 'Close the spot list' : 'Show all spots'}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (open) setOpen(false);
            else {
              setQuery('');
              setOpen(true);
              inputRef.current?.focus();
            }
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <path d={open ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} />
          </svg>
        </button>
      </div>
      {open && (
        <ul className="sp-list" id={listId} role="listbox" aria-label="Spots">
          {matches.length === 0 && <li className="sp-empty">No spot matches “{q}”.</li>}
          {matches.map((s, i) => {
            const header = s.region !== lastRegion ? s.region : null;
            lastRegion = s.region;
            return (
              <li key={s.id} role="presentation">
                {header && <div className="sp-group">{header}</div>}
                <div
                  id={`${listId}-${s.id}`}
                  role="option"
                  aria-selected={s.id === value}
                  className={`sp-option${i === active ? ' active' : ''}${s.id === value ? ' chosen' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(s)}
                >
                  <span>
                    {s.name}
                    {(() => {
                      // Searched by another name: show which one matched.
                      const words = norm(q).split(/\s+/).filter(Boolean);
                      const alias = words.length && !words.every((w) => norm(s.name).includes(w)) ? s.aliases?.find((a) => words.some((w) => norm(a).includes(w))) : undefined;
                      return alias ? <span className="muted tiny"> · {alias}</span> : null;
                    })()}
                  </span>
                  <span className="muted tiny">
                    {s.breakType} · {s.level === 'all' ? 'all levels' : s.level}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
