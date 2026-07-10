import { useEffect, useRef, useState } from 'react';

type Props = {
  onMove: (dx: number, dy: number) => void;
  onInteract: () => void;
  onDrop: () => void;
};

const stickRadius = 58;
const deadZone = 0.24;
const moveIntervalMs = 100;

function clampStick(dx: number, dy: number) {
  const distance = Math.hypot(dx, dy);
  if (distance <= stickRadius) return { x: dx, y: dy, power: distance / stickRadius };
  return {
    x: (dx / distance) * stickRadius,
    y: (dy / distance) * stickRadius,
    power: 1,
  };
}

function getMoveDirection(x: number, y: number) {
  const horizontal = Math.abs(x);
  const vertical = Math.abs(y);
  if (horizontal > vertical * 1.5) return { dx: Math.sign(x), dy: 0 };
  if (vertical > horizontal * 1.5) return { dx: 0, dy: Math.sign(y) };
  return { dx: Math.sign(x), dy: Math.sign(y) };
}

export function MobileControls({ onMove, onInteract, onDrop }: Props) {
  const padRef = useRef<HTMLDivElement | null>(null);
  const activePointerRef = useRef<number | null>(null);
  const directionRef = useRef({ x: 0, y: 0, power: 0 });
  const onMoveRef = useRef(onMove);
  const [thumb, setThumb] = useState({ x: 0, y: 0 });

  useEffect(() => {
    onMoveRef.current = onMove;
  }, [onMove]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const direction = directionRef.current;
      if (direction.power < deadZone) return;
      const { dx, dy } = getMoveDirection(direction.x, direction.y);
      onMoveRef.current(dx, dy);
    }, moveIntervalMs);

    return () => window.clearInterval(timer);
  }, []);

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
    activePointerRef.current = null;
    directionRef.current = { x: 0, y: 0, power: 0 };
    setThumb({ x: 0, y: 0 });
  }

  return (
    <div className="mobile-controls" aria-hidden={false}>
      <div
        ref={padRef}
        className="mobile-stick"
        onPointerDown={(event) => {
          activePointerRef.current = event.pointerId;
          event.currentTarget.setPointerCapture(event.pointerId);
          updateStick(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => {
          if (activePointerRef.current === event.pointerId) updateStick(event.clientX, event.clientY);
        }}
        onPointerUp={(event) => {
          if (activePointerRef.current === event.pointerId) resetStick();
        }}
        onPointerCancel={(event) => {
          if (activePointerRef.current === event.pointerId) resetStick();
        }}
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
