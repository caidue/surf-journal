import { useState, type ReactNode } from 'react';
import type { Settings, SkillProfile, Stage } from '../types';
import { saveSettings } from '../db';
import {
  BODY_SCALE,
  BOARDS,
  FREQUENCY_OPTIONS,
  nearestStep,
  PADDLE_OPTIONS,
  profileCheck,
  profileForStage,
  REEF_OPTIONS,
  STAGES,
  STEEP_OPTIONS,
  WATER_OPTIONS,
  YEARS_OPTIONS,
} from '../lib/skill';
import { ActionBar } from './ui';
import StageCard from './StageCard';

type StepId = 'stage' | 'comfort' | 'max' | 'board' | 'reef' | 'paddle' | 'steep' | 'often' | 'water' | 'summary';
const STEPS: { id: StepId; optional?: boolean }[] = [
  { id: 'stage' },
  { id: 'comfort' },
  { id: 'max' },
  { id: 'board' },
  { id: 'reef' },
  { id: 'paddle' },
  { id: 'steep', optional: true },
  { id: 'often', optional: true },
  { id: 'water', optional: true },
  { id: 'summary' },
];
const QUESTIONS = STEPS.length - 1;

/**
 * "Your surfing": six short questions and three optional ones. At first launch (no profile yet)
 * they end on a summary with "Start surfing"; from Settings → Your surfing (`#/surfing`,
 * `?step=comfort` jumps straight to the comfortable size) "Done" saves and goes back to Settings.
 */
export default function Onboarding({ settings, go, first, startAt }: { settings: Settings; go: (p: string) => void; first: boolean; startAt?: string | null }) {
  const [draft, setDraft] = useState<SkillProfile>(() => settings.profile ?? profileForStage(4));
  const [touchedStage, setTouchedStage] = useState(!first);
  const [i, setI] = useState(() => Math.max(0, STEPS.findIndex((s) => s.id === startAt)));
  const step = STEPS[i];
  const unit = settings.heightUnit;
  const h = (m: number) => (unit === 'ft' ? `${Math.round(m * 3.281)} ft` : `${m.toFixed(1)} m`);
  const set = (patch: Partial<SkillProfile>) => setDraft((d) => ({ ...d, ...patch }));
  // At first launch the questions end on a summary; when editing, they stop at the last question
  // and "Done" saves straight away.
  const lastStep = first ? STEPS.length - 1 : QUESTIONS - 1;
  const next = () => setI((x) => Math.min(lastStep, x + 1));
  const back = () => (i === 0 ? go('settings') : setI((x) => x - 1));
  /** Choose and move on (single-choice questions). */
  const pick = (patch: Partial<SkillProfile>) => {
    set(patch);
    setTimeout(next, 140);
  };

  const save = async () => {
    const { lastChange: _drop, ...rest } = draft;
    await saveSettings({ profile: { ...rest, max: Math.max(rest.max, rest.comfort), updatedAt: Date.now() } });
    go(first ? 'explore' : 'settings');
  };

  const option = (key: string | number, on: boolean, label: ReactNode, onClick: () => void, sub?: ReactNode, num?: ReactNode) => (
    <li key={key}>
      <button type="button" className={`ob-option${on ? ' on' : ''}`} aria-pressed={on} onClick={onClick}>
        {num != null && <span className="ob-num">{num}</span>}
        <span>
          {label}
          {sub && <span className="ob-sub">{sub}</span>}
        </span>
      </button>
    </li>
  );

  let title = '';
  let lead: ReactNode = null;
  let body: ReactNode = null;
  switch (step.id) {
    case 'stage':
      title = 'Where are you with your surfing?';
      lead = 'Pick the line that fits you best today.';
      body = (
        <ul className="ob-options">
          {STAGES.map((s) =>
            option(s.stage, draft.stage === s.stage, s.title, () => {
              // At first launch a stage pre-fills the later answers with what's typical for it.
              pick(first && (!touchedStage || s.stage !== draft.stage) ? { ...profileForStage(s.stage as Stage, draft.board), wantsChallenge: draft.wantsChallenge } : { stage: s.stage as Stage });
              setTouchedStage(true);
            }, s.level, s.stage),
          )}
        </ul>
      );
      break;
    case 'comfort':
      title = 'What size are you comfortable in?';
      lead = 'Face height of the waves, from the trough to the lip, as you would describe them on the beach (not "Hawaiian" back-measured feet).';
      body = (
        <ul className="ob-options">
          {BODY_SCALE.map((b) => option(b.id, nearestStep(draft.comfort).id === b.id, b.label, () => pick({ comfort: b.m, max: Math.max(draft.max, b.m) }), `about ${h(b.m)}`))}
        </ul>
      );
      break;
    case 'max':
      title = "What's the biggest you've caught?";
      lead = 'Waves you actually rode, not just paddled out in.';
      body = (
        <ul className="ob-options">
          {BODY_SCALE.filter((b) => b.m >= nearestStep(draft.comfort).m).map((b) => option(b.id, nearestStep(Math.max(draft.max, draft.comfort)).id === b.id, b.label, () => pick({ max: b.m }), `about ${h(b.m)}`))}
        </ul>
      );
      break;
    case 'board':
      title = 'What do you usually ride?';
      body = <ul className="ob-options">{BOARDS.map((b) => option(b.id, draft.board === b.id, b.label, () => pick({ board: b.id })))}</ul>;
      break;
    case 'reef':
      title = 'Have you surfed over reef or rock?';
      lead = 'Most spots in northern Fuerteventura break over volcanic reef.';
      body = <ul className="ob-options">{REEF_OPTIONS.map((o) => option(o.v, draft.reefExp === o.v, o.label, () => pick({ reefExp: o.v })))}</ul>;
      break;
    case 'paddle':
      title = 'Getting out on a bigger day';
      lead = 'Sets about head high, breaking all the way in. What do you do?';
      body = <ul className="ob-options">{PADDLE_OPTIONS.map((o) => option(o.v, draft.paddleOut === o.v, o.label, () => pick({ paddleOut: o.v })))}</ul>;
      break;
    case 'steep':
      title = 'Steep and hollow waves';
      lead = 'Optional.';
      body = <ul className="ob-options">{STEEP_OPTIONS.map((o) => option(o.v, draft.steepExp === o.v, o.label, () => pick({ steepExp: o.v })))}</ul>;
      break;
    case 'often':
      title = 'How often, and how long?';
      lead = 'Optional.';
      body = (
        <>
          <h3 className="small ob-group">How often do you surf?</h3>
          <ul className="ob-options">{FREQUENCY_OPTIONS.map((o) => option(o.v, draft.frequency === o.v, o.label, () => set({ frequency: o.v })))}</ul>
          <h3 className="small ob-group">For how long have you been surfing?</h3>
          <ul className="ob-options">{YEARS_OPTIONS.map((o) => option(o.v, draft.years === o.v, o.label, () => set({ years: o.v })))}</ul>
        </>
      );
      break;
    case 'water':
      title = 'In the water without your board';
      lead = 'Optional. Can you swim 25 m and stay calm out of your depth without your board?';
      body = <ul className="ob-options">{WATER_OPTIONS.map((o) => option(o.v, draft.waterConfidence === o.v, o.label, () => pick({ waterConfidence: o.v })))}</ul>;
      break;
    case 'summary': {
      const check = profileCheck(draft);
      title = first ? "That's you" : 'Your surfing';
      body = (
        <>
          <StageCard profile={draft} unit={unit} />
          {check && <div className="alert soft">{check}</div>}
          <label className="row gap" style={{ alignItems: 'flex-start', marginTop: 'var(--sp-3)' }}>
            <input type="checkbox" checked={!!draft.wantsChallenge} onChange={(e) => set({ wantsChallenge: e.target.checked })} />
            <span>
              I want to push my limits
              <span className="ob-sub">Waves between your comfortable size and the biggest you've caught show as "Stretch session" instead of "Challenging".</span>
            </span>
          </label>
          <p className="ob-note">
            The app compares every forecast with this: your comfortable size, the biggest you've caught, reef and steep waves, getting out and the wind. Sessions you log with
            "How did it feel?" nudge it in small steps, and it always says why.
          </p>
          <ul className="ob-options" style={{ marginTop: 'var(--sp-3)' }}>
            {STEPS.slice(0, -1).map((s, k) => option(s.id, false, <span className="small">Change: {STEP_NAMES[s.id]}</span>, () => setI(k)))}
          </ul>
        </>
      );
      break;
    }
  }

  return (
    <div className="onboarding with-action-bar">
      {step.id !== 'summary' && (
        <div className="ob-progress" aria-label={`Question ${i + 1} of ${QUESTIONS}`}>
          {STEPS.slice(0, -1).map((s, k) => (
            <span key={s.id} className={k <= i ? 'on' : ''} />
          ))}
        </div>
      )}
      {first && i === 0 && <p className="eyebrow">Welcome to Surf Journal</p>}
      <h1>{title}</h1>
      {lead && <p className="lead">{lead}</p>}
      {body}
      <ActionBar note={step.id !== 'summary' ? `${i + 1} of ${QUESTIONS}${step.optional ? ' · optional' : ''}` : undefined}>
        {(i > 0 || !first) && (
          <button className="btn" onClick={back}>
            Back
          </button>
        )}
        {step.id === 'summary' ? (
          <button className="btn primary" onClick={save}>
            {first ? 'Start surfing' : 'Save'}
          </button>
        ) : (
          <>
            {!first && (
              <button className={`btn${i === lastStep ? ' primary' : ''}`} onClick={save}>
                Done
              </button>
            )}
            {i < lastStep && (
              <button className="btn primary" onClick={next}>
                {step.optional && !answered(step.id, draft) ? 'Skip' : 'Next'}
              </button>
            )}
          </>
        )}
      </ActionBar>
    </div>
  );
}

function answered(id: StepId, p: SkillProfile): boolean {
  if (id === 'steep') return p.steepExp != null;
  if (id === 'often') return !!(p.frequency || p.years);
  if (id === 'water') return !!p.waterConfidence;
  return true;
}

const STEP_NAMES: Record<StepId, string> = {
  stage: 'stage',
  comfort: 'comfortable size',
  max: 'biggest wave',
  board: 'board',
  reef: 'reef experience',
  paddle: 'getting out',
  steep: 'steep waves',
  often: 'how often',
  water: 'water confidence',
  summary: 'summary',
};
