import { useMemo, useRef, useState, type ReactNode } from 'react';
import type { HourConditions, Session, Settings, Spot } from '../types';
import { tideLabel, type Derived } from '../lib/conditions';
import { align, closestPair, featureCloseness, SHIFT_STEP, shiftRange, type DayHour } from '../lib/compare';
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
  /** The session's hours, derived for this spot. */
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
const cap = (s: string) => s.replace(/^./, (c) => c.toUpperCase());
const STEPS = [-30, -15, 15, 30];

/**
 * A logged session on another day's forecast (Sessions tab of a spot): your session as a band on
 * the day's chart, draggable in 15-minute steps within daylight; below, the conditions of the
 * closest lined-up hour then and on that day.
 */
export default function SessionCompare({ spot, session, derived, rec, hours, sunrise, sunset, dayWord, nowMin, settings, onBack, daySwitch }: Props) {
  const surfed = useMemo(() => surfedHourIdx(session).map((i) => derived[i]).filter((d): d is Derived => !!d), [session, derived]);
  const rise = sunrise ?? 420;
  const set = sunset ?? 1170;
  const view: [number, number] = [Math.max(0, Math.floor((rise - 60) / 60) * 60), Math.min(1440, Math.ceil((set + 60) / 60) * 60)];
  const dayHours: DayHour[] = useMemo(() => rec.hours.map((h) => ({ d: h.derived, daylight: h.daylight })), [rec]);
  // Daylight as the ratings count it (hours at least half after sunrise / before sunset), so the
  // closest pair behind "% like today" can always be lined up.
  const light = rec.hours.filter((h) => h.daylight).map((h) => isoToMin(h.time) ?? 0);
  const range = shiftRange(session.startMin, session.endMin, light.length ? Math.min(...light) : rise, light.length ? Math.max(...light) + 60 : set);
  const closest = useMemo(() => closestPair(spot, surfed, dayHours), [spot, surfed, dayHours]);
  const bestShift = clamp(closest ? closest.dayMin - closest.sessMin : range[0], range[0], range[1]);
  const [shiftState, setShift] = useState<number | null>(null);
  const shift = clamp(shiftState ?? bestShift, range[0], range[1]);
  const a = useMemo(() => align(spot, surfed, dayHours, shift), [spot, surfed, dayHours, shift]);
  const move = (to: number) => setShift(clamp(Math.round(to / SHIFT_STEP) * SHIFT_STEP, range[0], range[1]));

  // Drag the session band along the day: 15-minute steps on the chart's time scale.
  const [wrapRef, width] = useElementWidth<HTMLDivElement>();
  const pxPerMin = Math.max(100, width - LABEL_W - PAD_R) / (view[1] - view[0]);
  const drag = useRef<{ x: number; shift: number } | null>(null);

  const scores: HourScore[] = rec.hours.map((h) => ({ score: h.score, unsuitable: h.suit.status === 'unsuitable' }));
  const overall = sessionOverall(session);
  const day = cap(dayWord);
  const when = (m: number) => fmtMin(clamp(m, 0, 1440));

  const fmt = (key: string, d: Derived): string => {
    switch (key) {
      case 'size':
        return fmtHeight(d.hIn, settings.heightUnit);
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
          <h3>Your session on {fmtDate(session.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</h3>
          <div className="muted small">
            {fmtMin(session.startMin)}–{fmtMin(session.endMin)}
            {overall != null && ` · you rated it ${overall.toFixed(1)}/10`} · <a href={`#/session/${session.id}`}>Edit session</a>
          </div>
        </div>
        <button type="button" className="sheet-close" onClick={onBack} aria-label="Back to the sessions" title="Back to the sessions">
          <Icon name="back" size={20} />
        </button>
      </div>

      <div className="sheet-day">{daySwitch}</div>

      {!surfed.length ? (
        <p className="muted">No conditions saved for this session yet (added when you're online).</p>
      ) : (
        <>
          {closest && (
            <p className="cmp-explain">
              <strong>
                {closest.pct}% like {dayWord}
              </strong>
              : your {fmtMin(closest.sessMin)} hour best matches {dayWord} {fmtMin(closest.dayMin)} (swell, wind, tide). Drag your session to compare other times.
            </p>
          )}

          <div
            ref={wrapRef}
            className="cmp-drag"
            tabIndex={0}
            role="slider"
            aria-label={`Your session on ${dayWord}'s forecast; drag or use the arrow keys to move it`}
            aria-valuemin={range[0]}
            aria-valuemax={range[1]}
            aria-valuenow={shift}
            aria-valuetext={`${when(session.startMin + shift)}–${when(session.endMin + shift)}`}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') move(shift - SHIFT_STEP);
              else if (e.key === 'ArrowRight') move(shift + SHIFT_STEP);
              else return;
              e.preventDefault();
            }}
            onPointerDown={(e) => {
              (e.currentTarget as Element).setPointerCapture(e.pointerId);
              drag.current = { x: e.clientX, shift };
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              if (d) move(d.shift + (e.clientX - d.x) / pxPerMin);
            }}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
            onLostPointerCapture={() => (drag.current = null)}
          >
            <Timeline
              hours={rec.hours.map((h) => hours[h.idx])}
              derived={rec.hours.map((h) => h.derived)}
              scores={scores}
              scoreLabel="Rating"
              scoreSub="for you"
              spot={spot}
              sunrise={sunrise}
              sunset={sunset}
              heightUnit={settings.heightUnit}
              windUnit={settings.windUnit}
              view={view}
              nowMin={nowMin}
              session={{ startMin: session.startMin + shift, endMin: session.endMin + shift }}
              sessionLabel={`Your session · ${when(session.startMin + shift)}–${when(session.endMin + shift)} ↔`}
            />
          </div>

          <div className="cmp-controls">
            {STEPS.map((s) => (
              <button
                key={s}
                type="button"
                className="nudge"
                onClick={() => move(shift + s)}
                disabled={s < 0 ? shift <= range[0] : shift >= range[1]}
                aria-label={`${Math.abs(s)} minutes ${s < 0 ? 'earlier' : 'later'}`}
              >
                {s < 0 ? `−${-s}` : `+${s}`}
              </button>
            ))}
            {shift !== bestShift && (
              <button type="button" className="nudge" onClick={() => setShift(bestShift)}>
                Best match
              </button>
            )}
          </div>

          {a.best ? (
            <table className="cmp-table">
              <caption>
                <strong>{a.mean}% alike</strong>
                <span className="muted">
                  {' '}
                  at {when(session.startMin + shift)}–{when(session.endMin + shift)}
                  {a.pairs.length > 1 && ` · closest hour ${a.best.pct}%`}: your {fmtMin(a.best.sessMin)} vs {fmtMin(a.best.dayMin)}
                </span>
              </caption>
              <thead>
                <tr>
                  <th scope="col">Condition</th>
                  <th scope="col">Then</th>
                  <th scope="col">{day}</th>
                  <th scope="col">How close</th>
                </tr>
              </thead>
              <tbody>
                {SPOT_FEATURES.map((f) => {
                  const c = featureCloseness(f.key, a.best!.parts);
                  return (
                    <tr key={f.key}>
                      <th scope="row">{cap(f.label)}</th>
                      <td>{fmt(f.key, a.best!.sess)}</td>
                      <td>{fmt(f.key, a.best!.day)}</td>
                      <td>
                        {c == null ? (
                          <span className="muted">–</span>
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
          ) : (
            <p className="muted">No forecast for these hours {dayWord}.</p>
          )}
        </>
      )}
    </div>
  );
}
