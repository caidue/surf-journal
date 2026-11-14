import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Spot, UserPhoto } from '../types';
import { db } from '../db';
import { uid } from '../lib/time';
import { MONTH_NAMES, monthRanges } from '../lib/format';
import { Icon } from './icons';

const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

export function MonthScale({ months, small }: { months: number[]; small?: boolean }) {
  const set = new Set(months);
  return (
    <div className={`months${small ? ' small' : ''}`} role="img" aria-label={`Best months: ${monthRanges(months)}`}>
      {MONTHS.map((l, i) => (
        <span key={i} className={set.has(i + 1) ? 'on' : ''} title={MONTH_NAMES[i]}>
          {l}
        </span>
      ))}
    </div>
  );
}

const uniq = (xs: string[]) => {
  const seen = new Set<string>();
  return xs.filter((x) => {
    const k = x.trim().toLowerCase();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

/**
 * The practical guide for a spot: photos, each peak (break, bottom, direction, level, when it's good),
 * best season, boards, paddling in and out, warnings, parking and facilities.
 */
export default function SpotGuide({ spot, compact }: { spot: Spot; compact?: boolean }) {
  const g = spot.guide ?? {};
  const warnings = uniq([...(g.warnings ?? []), ...spot.hazards]);
  const access = g.access ?? {};
  const hasAccess = !!(access.paddleOut || access.paddleIn || access.easier || access.harder);

  return (
    <div className={`guide${compact ? ' compact' : ''}`}>
      {spot.description && (
        <section>
          <h4>About this spot</h4>
          <p className="guide-intro">{spot.description}</p>
        </section>
      )}

      <Photos spot={spot} />

      {spot.peaks.length > 0 && (
        <section>
          <h4>{spot.peaks.length === 1 ? 'The wave' : `The peaks (${spot.peaks.length})`}</h4>
          <div className="peak-cards">
            {spot.peaks.map((p) => {
              const tags = [
                p.breakType && `${p.breakType} break`,
                p.bottom && `${p.bottom} bottom`,
                p.direction,
                p.level && (p.level === 'all' ? 'all levels' : p.level),
                p.power,
                p.peel && `${p.peel} peel`,
                p.tide && (p.tide === 'all' ? 'all tides' : `${p.tide} tide`),
                p.minSize != null && p.maxSize != null ? `${p.minSize}–${p.maxSize} m` : p.minSize != null ? `from ${p.minSize} m` : p.maxSize != null ? `up to ${p.maxSize} m` : null,
              ].filter(Boolean) as string[];
              return (
                <div key={p.id} className="peak-card">
                  <strong>{p.name}</strong>
                  {tags.length > 0 && (
                    <div className="peak-tags">
                      {tags.map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                    </div>
                  )}
                  {p.description && <p>{p.description}</p>}
                  {p.goodWhen && (
                    <p>
                      <span className="label">Best when</span> {p.goodWhen}
                    </p>
                  )}
                  {p.season && p.season.length > 0 && <MonthScale months={p.season} small />}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {g.season && g.season.length > 0 && (
        <section>
          <h4>Best season</h4>
          <MonthScale months={g.season} />
          {g.seasonNote && <p className="muted small">{g.seasonNote}</p>}
        </section>
      )}

      {g.boards && g.boards.length > 0 && (
        <section>
          <h4>Boards</h4>
          <div className="chips small static">
            {g.boards.map((b) => (
              <span key={b} className="chip">
                {b}
              </span>
            ))}
          </div>
        </section>
      )}

      {hasAccess && (
        <section>
          <h4>Paddling in and out</h4>
          <dl className="facts">
            {access.paddleOut && (
              <>
                <dt>Out</dt>
                <dd>{access.paddleOut}</dd>
              </>
            )}
            {access.paddleIn && (
              <>
                <dt>In</dt>
                <dd>{access.paddleIn}</dd>
              </>
            )}
            {access.easier && (
              <>
                <dt>Easier</dt>
                <dd>{access.easier}</dd>
              </>
            )}
            {access.harder && (
              <>
                <dt>Harder</dt>
                <dd>{access.harder}</dd>
              </>
            )}
          </dl>
        </section>
      )}

      {warnings.length > 0 && (
        <section>
          <h4>Watch out</h4>
          <ul className="warnings">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </section>
      )}

      {g.parking && (
        <section>
          <h4>Parking</h4>
          <p>{g.parking}</p>
        </section>
      )}

      {g.facilities && g.facilities.length > 0 && (
        <section>
          <h4>Nearby</h4>
          <ul className="plain">
            {g.facilities.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </section>
      )}

      {g.sources && g.sources.length > 0 && (
        <details className="sources muted tiny">
          <summary>Sources</summary>
          <ul>
            {g.sources.map((u) => (
              <li key={u}>
                <a href={u} target="_blank" rel="noreferrer">
                  {u.replace(/^https?:\/\/(www\.)?/, '').slice(0, 70)}
                </a>
              </li>
            ))}
          </ul>
          <p>Compiled from public guides; conditions change, so check locally.</p>
        </details>
      )}
    </div>
  );
}

/* ---------------- photos: Wikimedia Commons + your own ---------------- */

interface Shown {
  key: string;
  src: string;
  caption?: string;
  credit?: { text: string; href: string };
  own?: UserPhoto;
}

async function shrink(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Could not read the image'))), 'image/jpeg', 0.82));
  return { blob, width: w, height: h };
}

interface Draft {
  blob: Blob;
  width: number;
  height: number;
  url: string;
  caption: string;
}

function Photos({ spot }: { spot: Spot }) {
  const own = useLiveQuery(() => db.photos.where('spotId').equals(spot.id).sortBy('addedAt'), [spot.id]);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Shown | null>(null);
  /** Photos picked but not saved yet: you can describe each before adding it. */
  const [drafts, setDrafts] = useState<Draft[]>([]);

  const urls = useMemo(() => new Map((own ?? []).map((p) => [p.id, URL.createObjectURL(p.blob)])), [own]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);

  const shown: Shown[] = [
    ...(own ?? []).map((p) => ({ key: p.id, src: urls.get(p.id)!, caption: p.caption, own: p })),
    ...(spot.guide?.photos ?? []).map((p) => ({
      key: p.imageUrl,
      src: p.imageUrl,
      caption: p.caption,
      credit: { text: `${p.author} · ${p.license} · Wikimedia Commons`, href: p.pageUrl },
    })),
  ];

  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      const out: Draft[] = [];
      for (const f of Array.from(files)) {
        const { blob, width, height } = await shrink(f);
        out.push({ blob, width, height, url: URL.createObjectURL(blob), caption: '' });
      }
      setDrafts(out);
    } catch (e: any) {
      setError(e?.message ?? 'Could not read the photo');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };
  const discardDrafts = () => {
    drafts.forEach((d) => URL.revokeObjectURL(d.url));
    setDrafts([]);
  };
  const saveDrafts = async () => {
    const now = Date.now();
    await db.photos.bulkPut(
      drafts.map((d, k) => ({ id: uid(), spotId: spot.id, blob: d.blob, width: d.width, height: d.height, caption: d.caption.trim() || undefined, addedAt: now + k })),
    );
    discardDrafts();
  };

  return (
    <section>
      <div className="section-head">
        <h4>Photos</h4>
        <button className="btn small" onClick={() => input.current?.click()} disabled={busy}>
          {busy ? 'Reading…' : '+ Add photo'}
        </button>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => pick(e.target.files)} />
      </div>
      {error && <div className="alert">{error}</div>}
      {shown.length ? (
        <div className="photo-strip">
          {shown.map((p) => (
            <button key={p.key} className="photo" onClick={() => setOpen(p)} aria-label={p.caption ? `Photo: ${p.caption}` : 'Open photo'}>
              {/* CORS for Commons so the service worker can keep a normal (not opaque) copy for offline use. */}
              <img src={p.src} alt={p.caption ?? spot.name} loading="lazy" crossOrigin={p.own ? undefined : 'anonymous'} />
              {p.own && <span className="photo-badge">yours</span>}
              {p.caption && (
                <span className="photo-text" title="Has a description">
                  <Icon name="text" size={14} />
                </span>
              )}
            </button>
          ))}
        </div>
      ) : (
        <p className="muted small">No photos yet. Add your own: they stay on this device and are included in backups.</p>
      )}
      {open && <Lightbox photo={open} onClose={() => setOpen(null)} onCaption={(caption) => setOpen({ ...open, caption })} />}
      {drafts.length > 0 && <AddPhotos drafts={drafts} onChange={setDrafts} onCancel={discardDrafts} onSave={saveDrafts} />}
    </section>
  );
}

/** Before adding: preview each picked photo with an optional description. */
function AddPhotos({ drafts, onChange, onCancel, onSave }: { drafts: Draft[]; onChange: (d: Draft[]) => void; onCancel: () => void; onSave: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && (e.stopPropagation(), onCancel());
    document.addEventListener('keydown', k, true);
    return () => document.removeEventListener('keydown', k, true);
  }, [onCancel]);
  return createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Add photos" onClick={onCancel}>
      <div className="add-photos" onClick={(e) => e.stopPropagation()}>
        <h3>{drafts.length === 1 ? 'Add photo' : `Add ${drafts.length} photos`}</h3>
        <div className="add-photos-list">
          {drafts.map((d, i) => (
            <div key={d.url} className="add-photo">
              <img src={d.url} alt="" />
              <label className="field first">
                Description <span className="muted small">(optional)</span>
                <textarea
                  rows={3}
                  value={d.caption}
                  autoFocus={i === 0}
                  placeholder="e.g. the take-off at mid tide, where to paddle out…"
                  onChange={(e) => onChange(drafts.map((x, k) => (k === i ? { ...x, caption: e.target.value } : x)))}
                />
              </label>
            </div>
          ))}
        </div>
        <div className="row gap add-photos-actions">
          <button className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn primary" onClick={onSave}>
            {drafts.length === 1 ? 'Add photo' : `Add ${drafts.length} photos`}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Lightbox({ photo, onClose, onCaption }: { photo: Shown; onClose: () => void; onCaption: (caption: string | undefined) => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(photo.caption ?? '');
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && (e.stopPropagation(), editing ? setEditing(false) : onClose());
    document.addEventListener('keydown', k, true);
    return () => document.removeEventListener('keydown', k, true);
  }, [onClose, editing]);
  const remove = async () => {
    if (!photo.own || !confirm('Delete this photo from this device?')) return;
    await db.photos.delete(photo.own.id);
    onClose();
  };
  const saveCaption = async () => {
    if (!photo.own) return;
    const caption = text.trim() || undefined;
    await db.photos.update(photo.own.id, { caption });
    onCaption(caption);
    setEditing(false);
  };
  return createPortal(
    <div className="lightbox" onClick={onClose} role="dialog" aria-modal="true" aria-label="Photo">
      <figure onClick={(e) => e.stopPropagation()}>
        <img src={photo.src} alt={photo.caption ?? ''} crossOrigin={photo.own ? undefined : 'anonymous'} />
        <figcaption>
          {editing ? (
            <label className="lb-edit">
              <span className="visually-hidden">Description</span>
              <textarea rows={3} value={text} autoFocus onChange={(e) => setText(e.target.value)} placeholder="Describe the photo…" />
            </label>
          ) : (
            photo.caption && <p className="lb-caption">{photo.caption}</p>
          )}
          {photo.credit && (
            <a href={photo.credit.href} target="_blank" rel="noreferrer">
              {photo.credit.text}
            </a>
          )}
          <span className="row gap lb-actions">
            {photo.own && !editing && (
              <>
                <button className="btn small danger" onClick={remove}>
                  Delete
                </button>
                <button className="btn small" onClick={() => setEditing(true)}>
                  {photo.caption ? 'Edit description' : 'Add description'}
                </button>
              </>
            )}
            {editing ? (
              <>
                <button className="btn small" onClick={() => setEditing(false)}>
                  Cancel
                </button>
                <button className="btn small primary" onClick={saveCaption}>
                  Save
                </button>
              </>
            ) : (
              <button className="btn small" onClick={onClose}>
                Close
              </button>
            )}
          </span>
        </figcaption>
      </figure>
    </div>,
    document.body,
  );
}
