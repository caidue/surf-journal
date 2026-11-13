import { useState } from 'react';
import type { Bottom, BreakType, Peak, Session, Spot, SpotGuide, SpotLevel, TidePref } from '../types';
import { db } from '../db';
import { compass } from '../lib/geo';
import { uid } from '../lib/time';
import MapView from './MapView';
import { ActionBar, Card, Chips, DirArrow } from './ui';

const DIRS = [0, 45, 90, 135, 180, 225, 270, 315];

function DirInput({ label, value, onChange, help }: { label: string; value: number; onChange: (v: number) => void; help?: string }) {
  return (
    <label>
      {label}
      <div className="row gap">
        <input type="number" min={0} max={359} value={Math.round(value)} onChange={(e) => onChange(((Number(e.target.value) % 360) + 360) % 360)} style={{ width: 80 }} />
        <span className="dir-preview">
          <DirArrow from={(value + 180) % 360} size={18} /> {compass(value)}
        </span>
      </div>
      <div className="chips small">
        {DIRS.map((d) => (
          <button key={d} type="button" className={`chip${Math.round(value) === d ? ' on' : ''}`} onClick={() => onChange(d)}>
            {compass(d)}
          </button>
        ))}
      </div>
      {help && <span className="muted tiny">{help}</span>}
    </label>
  );
}

export default function SpotEditor({ spot, sessions, regions, go, at }: { spot?: Spot; sessions: Session[]; regions: string[]; go: (p: string) => void; at?: { lat: number; lon: number } }) {
  const [s, setS] = useState<Spot>(
    spot ?? {
      id: uid(),
      name: '',
      region: regions[0] ?? '',
      lat: at?.lat ?? 28.73,
      lon: at?.lon ?? -13.9,
      coordsApprox: false,
      facing: 0,
      idealSwellDir: 0,
      swellWindow: 70,
      minSize: 0.5,
      maxSize: 2.5,
      tide: 'all',
      breakType: 'beach',
      bottom: 'sand',
      level: 'all',
      hazards: [],
      description: '',
      peaks: [],
      gain: 0.8,
      custom: true,
    },
  );
  const [hazardText, setHazardText] = useState(s.hazards.join(', '));
  const [guide, setGuide] = useState<SpotGuide>(spot?.guide ?? {});
  const setG = <K extends keyof SpotGuide>(k: K, v: SpotGuide[K]) => setGuide((g) => ({ ...g, [k]: v }));
  const setAccess = (k: 'paddleOut' | 'paddleIn' | 'easier' | 'harder', v: string) => setGuide((g) => ({ ...g, access: { ...g.access, [k]: v } }));
  const lines = (t: string) => t.split('\n').map((x) => x.trim()).filter(Boolean);
  const [warnText, setWarnText] = useState((spot?.guide?.warnings ?? []).join('\n'));
  const [facText, setFacText] = useState((spot?.guide?.facilities ?? []).join('\n'));
  const [boardText, setBoardText] = useState((spot?.guide?.boards ?? []).join(', '));
  const set = <K extends keyof Spot>(k: K, v: Spot[K]) => setS((cur) => ({ ...cur, [k]: v }));
  const used = spot ? sessions.filter((x) => x.spotId === spot.id).length : 0;

  const save = async () => {
    if (!s.name.trim()) return alert('Give the spot a name.');
    const hazards = hazardText
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean);
    const peaks = s.peaks.filter((p) => p.name.trim());
    const g: SpotGuide = {
      ...guide,
      warnings: lines(warnText),
      facilities: lines(facText),
      boards: boardText.split(',').map((b) => b.trim()).filter(Boolean),
    };
    await db.spots.put({ ...s, name: s.name.trim(), region: s.region.trim() || 'My spots', hazards, peaks, guide: g, updatedAt: Date.now() });
    go(`spot/${s.id}`);
  };

  const remove = async () => {
    if (!spot) return;
    if (used) return alert(`This spot has ${used} logged session(s). Delete or move those first.`);
    if (!confirm(`Delete ${spot.name}? This cannot be undone.`)) return;
    await db.spots.delete(spot.id);
    go('explore');
  };

  const setPeak = (i: number, patch: Partial<Peak>) => set('peaks', s.peaks.map((p, k) => (k === i ? { ...p, ...patch } : p)));

  return (
    <div className="page narrow with-action-bar">
      <h1>{spot ? `Edit ${spot.name}` : 'New spot'}</h1>
      <Card>
        <div className="form-grid">
          <label>
            Name
            <input value={s.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Rocky Point" />
          </label>
          <label>
            Region
            <input list="regions" value={s.region} onChange={(e) => set('region', e.target.value)} />
            <datalist id="regions">
              {regions.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </label>
        </div>
        <p className="muted small">Tap or click the map, or drag the marker, to where the waves break (not the car park).</p>
        <MapView
          markers={[{ id: s.id, lat: s.lat, lon: s.lon, color: '#0b6e99', label: '●', title: s.name || 'New spot', draggable: true }]}
          fit={{ south: s.lat - 0.012, north: s.lat + 0.012, west: s.lon - 0.018, east: s.lon + 0.018 }}
          onMapClick={(lat, lon) => setS((c) => ({ ...c, lat, lon, coordsApprox: false }))}
          onMarkerDrag={(_, lat, lon) => setS((c) => ({ ...c, lat, lon, coordsApprox: false }))}
          height={300}
          cooperative
        />
        <div className="row gap wrap small">
          <span>
            {s.lat.toFixed(5)}, {s.lon.toFixed(5)}
          </span>
          <label className="check">
            <input type="checkbox" checked={s.coordsApprox} onChange={(e) => set('coordsApprox', e.target.checked)} /> location is approximate
          </label>
        </div>
      </Card>

      <Card>
        <h3>How the spot works</h3>
        <div className="form-grid">
          <DirInput label="Faces (towards the sea)" value={s.facing} onChange={(v) => set('facing', v)} help={`Offshore wind blows from ${compass(s.facing + 180)}.`} />
          <DirInput label="Best swell direction (coming from)" value={s.idealSwellDir} onChange={(v) => set('idealSwellDir', v)} />
          <label>
            Swell window ± degrees
            <input type="number" min={15} max={120} value={s.swellWindow} onChange={(e) => set('swellWindow', Number(e.target.value))} />
          </label>
          <label>
            Works from / up to (breaking height, m)
            <div className="row gap">
              <input type="number" step={0.1} min={0.1} value={s.minSize} onChange={(e) => set('minSize', Number(e.target.value))} style={{ width: 80 }} />
              <span>–</span>
              <input type="number" step={0.1} min={0.2} value={s.maxSize} onChange={(e) => set('maxSize', Number(e.target.value))} style={{ width: 80 }} />
            </div>
          </label>
          <label>
            Size factor
            <input type="number" step={0.05} min={0.2} max={3} value={s.gain} onChange={(e) => set('gain', Number(e.target.value))} />
            <span className="muted tiny">Modelled breaking height × factor. Sheltered spots &lt; 1, swell magnets &gt; 1.</span>
          </label>
        </div>
        <div className="field">
          <span>Best tide</span>
          <Chips small options={(['low', 'low-mid', 'mid', 'mid-high', 'high', 'all'] as TidePref[]).map((t) => ({ id: t, label: t }))} value={s.tide} onChange={(v) => v && set('tide', v)} />
        </div>
        <div className="field">
          <span>Break type</span>
          <Chips small options={(['beach', 'reef', 'point'] as BreakType[]).map((t) => ({ id: t, label: t }))} value={s.breakType} onChange={(v) => v && set('breakType', v)} />
        </div>
        <div className="field">
          <span>Bottom</span>
          <Chips small options={(['sand', 'reef', 'rock', 'mixed'] as Bottom[]).map((t) => ({ id: t, label: t }))} value={s.bottom} onChange={(v) => v && set('bottom', v)} />
        </div>
        <div className="field">
          <span>Suitable from level</span>
          <Chips small options={(['beginner', 'all', 'intermediate', 'advanced', 'expert'] as SpotLevel[]).map((t) => ({ id: t, label: t }))} value={s.level} onChange={(v) => v && set('level', v)} />
        </div>
        <label className="field">
          Hazards (comma separated)
          <input value={hazardText} onChange={(e) => setHazardText(e.target.value)} placeholder="shallow reef, rips, urchins" />
        </label>
        <label className="field">
          Description
          <textarea rows={3} value={s.description} onChange={(e) => set('description', e.target.value)} />
        </label>
      </Card>

      <Card>
        <h3>Peaks / waves at this spot</h3>
        <p className="muted small">Add peaks (e.g. Inside and Outside) to record how long you spent at each during a session.</p>
        {s.peaks.map((p, i) => (
          <div key={p.id} className="peak-edit">
            <div className="row gap">
              <input value={p.name} onChange={(e) => setPeak(i, { name: e.target.value })} placeholder="Name" aria-label="Peak name" />
              <button className="btn small" onClick={() => set('peaks', s.peaks.filter((_, k) => k !== i))} aria-label={`Remove ${p.name}`}>
                Remove
              </button>
            </div>
            <input value={p.description ?? ''} onChange={(e) => setPeak(i, { description: e.target.value })} placeholder="Description (optional)" aria-label="Peak description" />
            <input value={p.goodWhen ?? ''} onChange={(e) => setPeak(i, { goodWhen: e.target.value })} placeholder="Best when… (tide, swell, wind, size)" aria-label="When this peak is good" />
            <div className="row gap wrap">
              <Chips small options={(['beach', 'reef', 'point'] as BreakType[]).map((t) => ({ id: t, label: t }))} value={p.breakType} onChange={(v) => setPeak(i, { breakType: v ?? undefined })} />
              <Chips small options={(['sand', 'reef', 'rock', 'mixed'] as Bottom[]).map((t) => ({ id: t, label: t }))} value={p.bottom} onChange={(v) => setPeak(i, { bottom: v ?? undefined })} />
              <Chips small options={['left', 'right', 'left and right'].map((t) => ({ id: t, label: t }))} value={p.direction} onChange={(v) => setPeak(i, { direction: v ?? undefined })} />
            </div>
            <Chips small options={(['beginner', 'all', 'intermediate', 'advanced', 'expert'] as SpotLevel[]).map((t) => ({ id: t, label: t }))} value={p.level} onChange={(v) => setPeak(i, { level: v ?? undefined })} />
          </div>
        ))}
        <button className="btn small" onClick={() => set('peaks', [...s.peaks, { id: uid(), name: s.peaks.length === 0 ? 'Inside' : s.peaks.length === 1 ? 'Outside' : '' }])}>
          + Add peak
        </button>
      </Card>

      <Card>
        <h3>Spot guide</h3>
        <div className="field">
          <span>Best months</span>
          <MonthToggle months={guide.season ?? []} onChange={(m) => setG('season', m)} />
          <input value={guide.seasonNote ?? ''} onChange={(e) => setG('seasonNote', e.target.value)} placeholder="Season note (optional)" />
        </div>
        <label className="field">
          Boards (comma separated)
          <input value={boardText} onChange={(e) => setBoardText(e.target.value)} placeholder="shortboard, step-up on big days" />
        </label>
        <div className="form-grid">
          <label>
            Paddle out
            <textarea rows={2} value={guide.access?.paddleOut ?? ''} onChange={(e) => setAccess('paddleOut', e.target.value)} placeholder="Where and how to get out" />
          </label>
          <label>
            Paddle in
            <textarea rows={2} value={guide.access?.paddleIn ?? ''} onChange={(e) => setAccess('paddleIn', e.target.value)} placeholder="Where and how to come back" />
          </label>
          <label>
            Easier when
            <textarea rows={2} value={guide.access?.easier ?? ''} onChange={(e) => setAccess('easier', e.target.value)} />
          </label>
          <label>
            Harder when
            <textarea rows={2} value={guide.access?.harder ?? ''} onChange={(e) => setAccess('harder', e.target.value)} />
          </label>
        </div>
        <label className="field">
          Warnings (one per line)
          <textarea rows={3} value={warnText} onChange={(e) => setWarnText(e.target.value)} placeholder={'strong current to the west\nclose-outs on big days'} />
        </label>
        <label className="field">
          Parking
          <textarea rows={2} value={guide.parking ?? ''} onChange={(e) => setG('parking', e.target.value)} />
        </label>
        <label className="field">
          Nearby facilities (one per line)
          <textarea rows={3} value={facText} onChange={(e) => setFacText(e.target.value)} placeholder={'café at the harbour\nsurf shop in town (2 km)'} />
        </label>
        <p className="muted tiny">Add photos on the spot page.</p>
      </Card>

      <ActionBar note={s.name.trim() ? undefined : 'To save: give the spot a name'}>
        {spot && (
          <button className="btn danger" onClick={remove}>
            Delete
          </button>
        )}
        <button className="btn" onClick={() => go(spot ? `spot/${spot.id}` : 'explore')}>
          Cancel
        </button>
        <button className="btn primary" onClick={save} disabled={!s.name.trim()}>
          Save spot
        </button>
      </ActionBar>
    </div>
  );
}

function MonthToggle({ months, onChange }: { months: number[]; onChange: (m: number[]) => void }) {
  const set = new Set(months);
  const names = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  return (
    <div className="months toggle">
      {names.map((l, i) => (
        <button
          key={i}
          type="button"
          className={set.has(i + 1) ? 'on' : ''}
          aria-pressed={set.has(i + 1)}
          aria-label={new Date(2000, i, 1).toLocaleString('en', { month: 'long' })}
          onClick={() => onChange(set.has(i + 1) ? months.filter((m) => m !== i + 1) : [...months, i + 1].sort((a, b) => a - b))}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
