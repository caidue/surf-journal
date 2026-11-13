import type { Session, Settings, Spot } from '../types';
import SpotView from './SpotView';

/** The same spot view as the Explore popup, as its own page (#/spot/:id). */
export default function SpotPage({ spot, spots, sessions, settings, go }: { spot: Spot; spots: Spot[]; sessions: Session[]; settings: Settings; go: (p: string) => void }) {
  return (
    <div className="page narrow">
      <div className="card">
        <SpotView spot={spot} spots={spots} sessions={sessions} settings={settings} go={go} mode="page" />
      </div>
    </div>
  );
}
