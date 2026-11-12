import { useMemo, useState } from 'react';
import type { Session, Settings, Spot } from '../types';
import { SLOT_MIN } from '../types';
import { db } from '../db';
import { deriveSeries, windKind, WIND_LABEL } from '../lib/conditions';
import { sessionOverall, surfedHourIdx } from '../lib/recommend';
import { fmtDate, fmtDuration, fmtMin } from '../lib/time';
import { fmtSurfRange, fmtWind } from '../lib/format';
import { Card, Empty, ScoreBadge, Sparkline } from './ui';

export function sessionSummary(s: Session, spot: Spot | undefined, settings: Settings): string {
  if (!spot) return '';
  const der = deriveSeries(spot, s.conditions);
  const idx = surfedHourIdx(s);
  const hbs = idx.map((i) => der[i]?.hb).filter((v): v is number => v != null);
  const mid = der[idx[Math.floor(idx.length / 2)]];
  if (!mid) return '';
  const hb = hbs.length ? hbs.reduce((a, b) => a + b, 0) / hbs.length : null;
  const wk = windKind(mid);
  return `${fmtSurfRange(hb, settings.heightUnit)} · ${mid.tDom ? Math.round(mid.tDom) + ' s' : '–'} · ${wk ? WIND_LABEL[wk] : '–'} ${fmtWind(mid.windSpeed, settings.windUnit)}`;
}

export default function Journal({ spots, sessions, settings, go }: { spots: Spot[]; sessions: Session[]; settings: Settings; go: (p: string) => void }) {
  const [spotFilter, setSpotFilter] = useState('');
  const [text, setText] = useState('');
  const [hideExcluded, setHideExcluded] = useState(false);
  const [cutoff, setCutoff] = useState('');
  const spotById = useMemo(() => new Map(spots.map((s) => [s.id, s])), [spots]);

  const list = useMemo(() => {
    const t = text.trim().toLowerCase();
    return sessions
      .filter((s) => !spotFilter || s.spotId === spotFilter)
      .filter((s) => !hideExcluded || !s.excluded)
      .filter((s) => !t || `${s.notes} ${s.tags.join(' ')} ${s.fields.board ?? ''} ${spotById.get(s.spotId)?.name ?? ''}`.toLowerCase().includes(t))
      .sort((a, b) => (b.date + String(b.startMin).padStart(4, '0')).localeCompare(a.date + String(a.startMin).padStart(4, '0')));
  }, [sessions, spotFilter, hideExcluded, text, spotById]);

  const groups = useMemo(() => {
    const m = new Map<string, Session[]>();
    for (const s of list) {
      const k = s.date.slice(0, 7);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(s);
    }
    return [...m.entries()];
  }, [list]);

  const relevant = sessions.filter((s) => !s.excluded);
  const minutes = relevant.reduce((a, s) => a + (s.endMin - s.startMin), 0);
  const funs = relevant.map(sessionOverall).filter((v): v is number => v != null);

  const toggle = (s: Session) => db.sessions.update(s.id, { excluded: !s.excluded, updatedAt: Date.now() });
  const bulk = async () => {
    if (!cutoff) return;
    const ids = sessions.filter((s) => s.date < cutoff && !s.excluded).map((s) => s.id);
    if (!ids.length) return alert('No relevant sessions before that date.');
    if (!confirm(`Mark ${ids.length} session(s) before ${fmtDate(cutoff)} as not relevant? You can switch each one back later.`)) return;
    await db.sessions.where('id').anyOf(ids).modify({ excluded: true, updatedAt: Date.now() });
  };

  const usedSpots = spots.filter((sp) => sessions.some((s) => s.spotId === sp.id));

  return (
    <div className="page">
      <div className="row between wrap">
        <h1>Journal</h1>
        <button className="btn primary" onClick={() => go('log')}>
          + Log a session
        </button>
      </div>

      <div className="stats">
        <div>
          <strong>{relevant.length}</strong>
          <span>relevant sessions</span>
        </div>
        <div>
          <strong>{fmtDuration(minutes)}</strong>
          <span>in the water</span>
        </div>
        <div>
          <strong>{new Set(relevant.map((s) => s.spotId)).size}</strong>
          <span>spots</span>
        </div>
        <div>
          <strong>{funs.length ? (funs.reduce((a, b) => a + b, 0) / funs.length).toFixed(1) : '–'}</strong>
          <span>average fun</span>
        </div>
      </div>

      <Card className="filters">
        <div className="row gap wrap">
          <select value={spotFilter} onChange={(e) => setSpotFilter(e.target.value)} aria-label="Filter by spot">
            <option value="">All spots</option>
            {usedSpots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Search notes, tags, boards…" />
          <label className="check small">
            <input type="checkbox" checked={hideExcluded} onChange={(e) => setHideExcluded(e.target.checked)} /> hide not relevant
          </label>
        </div>
        <div className="row gap wrap">
          <span className="small">Skill jumped? Mark everything before</span>
          <input type="date" value={cutoff} onChange={(e) => setCutoff(e.target.value)} />
          <button className="btn small" disabled={!cutoff} onClick={bulk}>
            as not relevant
          </button>
        </div>
      </Card>

      {list.length === 0 ? (
        <Empty>
          {sessions.length ? 'No sessions match the filters.' : 'No sessions yet. Log your first one, or load demo sessions in Settings to try the recommendations.'}
        </Empty>
      ) : (
        groups.map(([month, items]) => (
          <section key={month}>
            <h3 className="month">{fmtDate(month + '-15', { month: 'long', year: 'numeric' })}</h3>
            <div className="session-list">
              {items.map((s) => {
                const spot = spotById.get(s.spotId);
                const fun = s.curves.fun ?? [];
                const lo = Math.floor(s.startMin / SLOT_MIN);
                const hi = Math.ceil(s.endMin / SLOT_MIN);
                const summary = sessionSummary(s, spot, settings);
                const zoneMins = spot?.peaks
                  .map((p) => ({ p, m: s.zones.filter((z) => z === p.id).length * SLOT_MIN }))
                  .filter((z) => z.m)
                  .map((z) => `${z.p.name} ${fmtDuration(z.m)}`)
                  .join(' · ');
                return (
                  <Card key={s.id} className={`session-item${s.excluded ? ' excluded' : ''}`}>
                    <a href={`#/session/${s.id}`} className="session-main">
                      <ScoreBadge score={sessionOverall(s)} />
                      <div>
                        <div>
                          <strong>{spot?.name ?? 'Unknown spot'}</strong> <span className="muted small">{fmtDate(s.date)}</span>
                          {s.demo && <span className="badge muted">demo</span>}
                          {(s.conditionsPending || !s.conditions.length) && (
                            <span className="badge pending" title="Logged offline: the conditions are added automatically the next time the app is online.">
                              conditions pending
                            </span>
                          )}
                        </div>
                        <div className="small">
                          {fmtMin(s.startMin)}–{fmtMin(s.endMin)} ({fmtDuration(s.endMin - s.startMin)})
                          {summary && ` · ${summary}`}
                        </div>
                        {zoneMins && <div className="small muted">{zoneMins}</div>}
                        {(s.tags.length > 0 || s.notes) && (
                          <div className="small muted clip">
                            {s.tags.join(', ')}
                            {s.tags.length && s.notes ? ' — ' : ''}
                            {s.notes}
                          </div>
                        )}
                      </div>
                      <Sparkline values={fun.slice(lo, hi)} color={settings.categories.find((c) => c.id === 'fun')?.color} />
                    </a>
                    <label className="check small relevance" title="Not relevant sessions stay in your journal but are ignored for predictions">
                      <input type="checkbox" checked={!s.excluded} onChange={() => toggle(s)} /> relevant
                    </label>
                  </Card>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
