import { useEffect, useRef } from 'react';
import type { Session, Settings, Spot } from '../types';
import SpotView from './SpotView';

interface Props {
  spot: Spot;
  spots: Spot[];
  sessions: Session[];
  settings: Settings;
  initialDay: number;
  onClose: () => void;
  go: (path: string) => void;
}

/** The spot view as a popup over Explore: bottom sheet on phones, dialog on wider screens. */
export default function SpotSheet({ spot, spots, sessions, settings, initialDay, onClose, go }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // keep the page behind from scrolling
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      prevFocus?.focus?.({ preventScroll: true });
    };
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" onClick={(e) => e.stopPropagation()}>
        <SpotView
          spot={spot}
          spots={spots}
          sessions={sessions}
          settings={settings}
          go={go}
          mode="sheet"
          initialDay={initialDay}
          titleId="sheet-title"
          headerActions={
            <>
              <button className="sheet-close" onClick={() => go(`spot/${spot.id}`)} aria-label="Open as a full page" title="Open as a full page">
                ⤢
              </button>
              <button ref={closeRef} className="sheet-close" onClick={onClose} aria-label="Close">
                ×
              </button>
            </>
          }
        />
      </div>
    </div>
  );
}
