import { useEffect, useRef, useState } from 'react';

type Props = {
  onMove: (dx: number, dy: number) => void;
  onInteract: () => void;
  onDrop: () => void;
};

const stickRadius = 58;
const deadZone = 0.24;

function clampStick(dx: number, dy: number) {
  const distance = Math.hypot(dx, dy);
  if (distance <= stickRadius) return { x: dx, y: dy, power: distance / stickRadius };
  return {
    x: (dx / distance) * stickRadius,
    y: (dy / distance) * stickRadius,
    power: 1,
  };
}

export function MobileControls({ onMove, onInteract, onDrop }: Props) {
  const padRef = useRef<HTMLDivElement | null>(null);
  const directionRef = useRef({ x: 0, y: 0, power: 0 });
  const [thumb, setThumb] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const timer = window.setInterval(() => {
      const direction = directionRef.current;
      if (direction.power < deadZone) return;
      onMove(Math.sign(direction.x), Math.sign(direction.y));
    }, 80);

    return () => window.clearInterval(timer);
  }, [onMove]);

  function updateStick(clientX: number, clientY: number) {
    const pad = padRef.current;
    if (!pad) return;
    const rect = pad.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const next = clampStick(clientX - centerX, clientY - centerY);
    directionRef.current = next;
    setThumb({ x: next.x, y: next.y });
  }

  function resetStick() {
    directionRef.current = { x: 0, y: 0, power: 0 };
    setThumb({ x: 0, y: 0 });
  }

  return (
    <div className="mobile-controls" aria-hidden={false}>
      <div
        ref={padRef}
        className="mobile-stick"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          updateStick(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => updateStick(event.clientX, event.clientY)}
        onPointerUp={resetStick}
        onPointerCancel={resetStick}
        role="application"
        aria-label="Движение"
      >
        <span className="mobile-stick-thumb" style={{ transform: `translate(${thumb.x}px, ${thumb.y}px)` }} />
      </div>

      <div className="mobile-actions">
        <button type="button" className="mobile-action primary" onClick={onInteract} aria-label="Действие">
          <span>Взять</span>
        </button>
        <button type="button" className="mobile-action" onClick={onDrop} aria-label="Бросить предмет">
          <span>Бросить</span>
        </button>
      </div>
    </div>
  );
}
