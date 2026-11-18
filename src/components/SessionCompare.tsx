import { useMemo, useRef, useState, type ReactNode } from 'react';
import type { HourConditions, Session, Settings, Spot } from '../types';
import { tideLabel, type Derived } from '../lib/conditions';
import { align, bestAlignment, featureCloseness, shiftRange, type DayHour } from '../lib/compare';
import { fmtHeight, fmtWind } from '../lib/format';
import { compass } from '../lib/geo';
import { sessionOverall, surfedHourIdx, type SpotRec } from '../lib/recommend';
import { SPOT_FEATURES } from '../lib/similarity';
import { fmtDate, fmtMin, isoToMin } from '../lib/time';
import { useElementWidth } from '../hooks';
import { Icon } from './icons';
import Timeline, { LABEL_W, PAD_R, type HourScore } from './Timeline';

interface Props {
  spot: Spot;
  session: Session;
  /** The session's hours, derived with the spot's size factor (buildHistory). */
  derived: Derived[];
  /** The day to compare with: its rated hours and conditions. */
  rec: SpotRec;
  hours: HourConditions[];
  sunrise: number | null;
  sunset: number | null;
  /** "today", "tomorrow", "Friday". */
  dayWord: string;
  nowMin: number | null;
  settings: Settings;
  onBack: () => void;
  /** The day switch (Today / Tomorrow / …), shared with the Forecast tab. */
  daySwitch: ReactNode;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const hhmm = (date: string, min: number) => `${date}T${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/**
 * A logged session next to another day (Sessions tab of a spot): the day's forecast on top, the
 * hours you surfed below on the same time scale. Drag the session (or use the buttons) to line it
 * up with other hours; the similarity of the lined-up hours and what makes it up are shown.
 */
export default function SessionCompare({ spot, session, derived, rec, hours, sunrise, sunset, dayWord, nowMin, settings, onBack, daySwitch }: Props) {
  const date = rec.hours[0]?.time.slice(0, 10) ?? '';
  const surfedIdx = useMemo(() => surfedHourIdx(session), [session]);
  const surfed = useMemo(() => surfedIdx.map((i) => derived[i]).filter((d): d is Derived => !!d), [surfedIdx, derived]);
  const view: [number, number] = [Math.max(0, Math.floor(((sunrise ?? 420) - 60) / 60) * 60), Math.min(1440, Math.ceil(((sunset ?? 1170) + 60) / 60) * 60)];
  const dayHours: DayHour[] = useMemo(() => rec.hours.map((h) => ({ d: h.derived, daylight: h.daylight })), [rec]);
  const range = useMemo(() => shiftRange(surfed, view[0], view[1]), [surfed, view[0], view[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  const initial = useMemo(() => (range ? bestAlignment(spot, surfed, dayHours, range) : null), [spot, surfed, dayHours, range]);
  const [shiftState, setShift] = useState<number | null>(null);
  const shift = clamp(shiftState ?? initial?.shift ?? range?.[0] ?? 0, range?.[0] ?? 0, range?.[1] ?? 0);
  const a = useMemo(() => align(spot, surfed, dayHours, shift), [spot, surfed, dayHours, shift]);

  // Dragging the session chart: whole hours on the shared time scale.
  const [wrapRef, width] = useElementWidth<HTMLDivElement>();
  const pxPerHour = (Math.max(100, width - LABEL_W - PAD_R) / (view[1] - view[0])) * 60;
  const drag = useRef<{ x: number; shift: number } | null>(null);
  const move = (to: number) => range && setShift(clamp(to, range[0], range[1]));

  const dayScores: HourScore[] = rec.hours.map((h) => ({ score: h.score, unsuitable: h.suit.status === 'unsuitable' }));
  const overall = sessionOverall(session);
  const shifted = surfedIdx
    .map((i) => ({ h: session.conditions[i], d: derived[i] }))
    .filter((x) => x.h && x.d)
    .map((x) => ({ m: (isoToMin(x.h.time) ?? 0) + shift, ...x }))
    .filter((x) => x.m >= 0 && x.m < 1440);
  const sessLabel = `${fmtDate(session.date, { weekday: 'short', day: 'numeric', month: 'short' })} · ${fmtMin(session.startMin)}–${fmtMin(session.endMin)}`;
  const listPct = initial?.best?.pct ?? null;

  const fmt = (key: string, d: Derived): string => {
    switch (key) {
      case 'size':
        return fmtHeight(d.hb, settings.heightUnit);
      case 'period':
        return d.tDom == null ? '–' : `${Math.round(d.tDom)} s`;
      case 'swellDir':
        return d.dirDom == null ? '–' : `${compass(d.dirDom)} ${Math.round(d.dirDom)}°`;
      case 'offshore':
        return d.uOff == null ? '–' : `${d.uOff >= 0 ? 'offshore' : 'onshore'} ${fmtWind(Math.abs(d.uOff), settings.windUnit)}`;
      case 'cross':
        return d.uX == null ? '–' : fmtWind(d.uX, settings.windUnit);
      case 'tide':
        return tideLabel(d.tideNorm, null);
      case 'tideTrend':
        return d.tideTrend == null ? '–' : d.tideTrend > 0.25 ? 'rising' : d.tideTrend < -0.25 ? 'falling' : 'turning';
      default:
        return '–';
    }
  };

  return (
    <div className="cmp">
      <div className="cmp-head">
        <div>
          <h3>
            Your session on {fmtDate(session.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </h3>
          <div className="muted small">
            {fmtMin(session.startMin)}–{fmtMin(session.endMin)}{overall != null && ` · you rated it ${overall.toFixed(1)}/10`} ·{' '}
            <a href={`#/session/${session.id}`}>Edit session</a>
          </div>
        </div>
        <button type="button" className="sheet-close" onClick={onBack} aria-label="Back to the sessions" title="Back to the sessions">
          <Icon name="back" size={20} />
        </button>
      </div>

      <div className="sheet-day">{daySwitch}</div>

      {!surfed.length ? (
        <p className="muted">No conditions are saved for this session yet (they are added when you're online).</p>
      ) : (
        <>
          {listPct != null && initial?.best && (
            <div className="cmp-explain">
              <strong>
                “{listPct}% like {dayWord}”
              </strong>{' '}
              is the closest single hour: the {fmtMin(initial.best.sessMin)} hour of your session on {fmtDate(session.date, { day: 'numeric', month: 'short' })} against {dayWord} {fmtMin(initial.best.dayMin)}. It weighs wave size, swell period and direction, wind and tide: 100% = the same, about 60% = each off by its usual tolerance.
            </div>
          )}

          <div className="cmp-chart-label">
            <strong>{dayWord.replace(/^./, (c) => c.toUpperCase())}</strong> <span className="muted small">forecast · dashed box = where your session is lined up</span>
          </div>
          <Timeline
            hours={rec.hours.map((h) => hours[h.idx])}
            derived={rec.hours.map((h) => h.derived)}
            scores={dayScores}
            scoreLabel="Rating"
            scoreSub="for you"
            spot={spot}
            sunrise={sunrise}
            sunset={sunset}
            heightUnit={settings.heightUnit}
            windUnit={settings.windUnit}
            view={view}
            nowMin={nowMin}
            highlight={{ startMin: session.startMin + shift, endMin: session.endMin + shift }}
          />

          <div className="cmp-controls">
            <span className="cmp-readout">
              {a.best ? (
                <>
                  Lined up with {dayWord} {fmtMin(clamp(session.startMin + shift, 0, 1440))}–{fmtMin(clamp(session.endMin + shift, 0, 1440))}: <strong>{a.mean}% alike</strong>
                  {a.pairs.length > 1 && ` on average, closest hour ${a.best.pct}%`}
                </>
              ) : (
                <>No forecast for these hours {dayWord}</>
              )}
            </span>
            <span className="cmp-buttons">
              <button type="button" className="nudge" onClick={() => move(shift - 60)} disabled={!range || shift <= range[0]} aria-label="One hour earlier">
                ← 1 h
              </button>
              <button type="button" className="nudge" onClick={() => move(shift + 60)} disabled={!range || shift >= range[1]} aria-label="One hour later">
                1 h →
              </button>
              {initial && shift !== initial.shift && (
                <button type="button" className="nudge" onClick={() => setShift(initial.shift)}>
                  Best match
                </button>
              )}
            </span>
          </div>

          <div
            ref={wrapRef}
            className="cmp-drag"
            tabIndex={0}
            role="slider"
            aria-label="Your session, drag to line it up with other hours"
            aria-valuemin={range?.[0]}
            aria-valuemax={range?.[1]}
            aria-valuenow={shift}
            aria-valuetext={`Lined up with ${fmtMin(clamp(session.startMin + shift, 0, 1440))}`}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') move(shift - 60);
              else if (e.key === 'ArrowRight') move(shift + 60);
              else return;
              e.preventDefault();
            }}
            onPointerDown={(e) => {
              (e.currentTarget as Element).setPointerCapture(e.pointerId);
              drag.current = { x: e.clientX, shift };
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              if (!d) return;
              const to = d.shift + Math.round((e.clientX - d.x) / pxPerHour) * 60;
              if (to !== shift) move(to);
            }}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
          >
            <Timeline
              hours={shifted.map((x) => ({ ...x.h, time: hhmm(date, x.m) }))}
              derived={shifted.map((x) => ({ ...x.d, time: hhmm(date, x.m) }))}
              scores={overall == null ? undefined : shifted.map(() => ({ score: overall, title: `You rated this session ${overall.toFixed(1)}/10` }))}
              scoreLabel="Fun"
              scoreSub="you rated"
              spot={spot}
              heightUnit={settings.heightUnit}
              windUnit={settings.windUnit}
              view={view}
              session={{ startMin: session.startMin + shift, endMin: session.endMin + shift }}
              sessionLabel={`Your session ${sessLabel} · drag ↔`}
              noAxis
            />
          </div>

          {a.best && (
            <table className="cmp-table">
              <caption className="muted small">
                Closest hour as lined up: the {fmtMin(a.best.sessMin)} hour of your session against {dayWord} {fmtMin(a.best.dayMin)} ({a.best.pct}% alike)
              </caption>
              <thead>
                <tr>
                  <th scope="col">Condition</th>
                  <th scope="col">Then</th>
                  <th scope="col">{dayWord.replace(/^./, (c) => c.toUpperCase())}</th>
                  <th scope="col">How close</th>
                </tr>
              </thead>
              <tbody>
                {SPOT_FEATURES.map((f) => {
                  const c = featureCloseness(f.key, a.best!.parts);
                  return (
                    <tr key={f.key}>
                      <th scope="row">{f.label.replace(/^./, (x) => x.toUpperCase())}</th>
                      <td>{fmt(f.key, a.best!.sess)}</td>
                      <td>{fmt(f.key, a.best!.day)}</td>
                      <td>
                        {c == null ? (
                          <span className="muted">no data</span>
                        ) : (
                          <span className="cmp-bar" title={`${c}%`}>
                            <span style={{ width: `${c}%`, background: c >= 60 ? 'var(--good)' : c >= 30 ? '#eab308' : 'var(--danger)' }} />
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
