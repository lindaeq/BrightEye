import { useEffect, useRef } from 'react';
import { useArcadeController } from '../context/ArcadeController';

const steeringKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyA', 'KeyS', 'KeyD'];
const deadZone = (value: number) => Math.abs(value) < 0.2 ? 0 : value;

export function useArcadeControls(move: (x: number, y: number, seconds: number) => void, fire?: () => void) {
  const { input, mouseMode } = useArcadeController();
  const handlers = useRef({ move, fire, mouseMode });
  handlers.current = { move, fire, mouseMode };

  useEffect(() => {
    const keys = new Set<string>();
    let frame: number;
    let previousTime = performance.now();
    let presses = input.current.presses;
    const keydown = (event: KeyboardEvent) => {
      if (event.target instanceof Element && event.target.closest('input, select, textarea, [contenteditable]')) return;
      if (steeringKeys.includes(event.code)) {
        event.preventDefault();
        keys.add(event.code);
      }
      if (event.code === 'Space' && handlers.current.fire &&
        !(event.target instanceof Element && event.target.closest('button, a'))) {
        event.preventDefault();
        if (!event.repeat) handlers.current.fire();
      }
    };
    const keyup = (event: KeyboardEvent) => { keys.delete(event.code); };
    const blur = () => keys.clear();
    const loop = (now: number) => {
      const seconds = Math.min(0.05, (now - previousTime) / 1000);
      previousTime = now;
      let x = Number(keys.has('ArrowRight') || keys.has('KeyD')) - Number(keys.has('ArrowLeft') || keys.has('KeyA'));
      let y = Number(keys.has('ArrowDown') || keys.has('KeyS')) - Number(keys.has('ArrowUp') || keys.has('KeyW'));
      const controller = input.current;
      if (!handlers.current.mouseMode) {
        x += deadZone(controller.x);
        y += deadZone(controller.y);
      }
      const fired = !handlers.current.mouseMode && controller.presses !== presses;
      presses = controller.presses;
      const magnitude = Math.max(1, Math.hypot(x, y));
      if (x || y) handlers.current.move(x / magnitude, y / magnitude, seconds);
      if (fired) handlers.current.fire?.();
      frame = requestAnimationFrame(loop);
    };
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    window.addEventListener('blur', blur);
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', blur);
    };
  }, [input]);
}
