import type { SkillProfile, Stage } from '../types';
import { boardInfo, bodyWord, REEF_OPTIONS, STAGES, stageBand, stageInfo } from '../lib/skill';

/**
 * The surfer's stage at a glance: a big stage badge, the skill band (Beginner … Expert, the same
 * bands that unlock spot levels), the stage's own words, a 1–8 ladder and badges for the key answers.
 */
export default function StageCard({ profile: p, unit }: { profile: SkillProfile; unit: 'm' | 'ft' }) {
  const info = stageInfo(p.stage);
  const band = stageBand(p.stage);
  const h = (m: number) => (unit === 'ft' ? `${Math.round(m * 3.281)} ft` : `${m.toFixed(1)} m`);
  const max = Math.max(p.max, p.comfort);
  return (
    <div className={`stage-card band-${band.toLowerCase()}`}>
      <div className="stage-badge" aria-hidden>
        <span className="stage-badge-label">Stage</span>
        <span className="stage-badge-num">{p.stage}</span>
      </div>
      <div className="stage-main">
        <div className="stage-tags">
          <span className="stage-band">{band}</span>
          <span className="stage-short">{info.short}</span>
        </div>
        <p className="stage-title">“{info.title}”</p>
        <ol className="stage-ladder" aria-label={`Stage ${p.stage} of ${STAGES.length}: ${info.short}`}>
          {STAGES.map((s) => (
            <li key={s.stage} className={s.stage < p.stage ? 'done' : s.stage === p.stage ? 'on' : ''} title={`Stage ${s.stage}: ${s.short} (${stageBand(s.stage as Stage)})`}>
              {s.stage}
            </li>
          ))}
        </ol>
      </div>
      <ul className="stage-chips" aria-label="Your answers">
        <li>
          Comfortable to <strong>{bodyWord(p.comfort)}</strong> · {h(p.comfort)}
        </li>
        <li>
          Caught up to <strong>{h(max)}</strong>
        </li>
        <li>{REEF_OPTIONS[p.reefExp].short.replace(/^./, (c) => c.toUpperCase())}</li>
        <li>{boardInfo(p.board).label.replace(/ \(.*\)$/, '')}</li>
        {p.wantsChallenge && <li className="chip-accent">Pushing my limits</li>}
      </ul>
    </div>
  );
}
