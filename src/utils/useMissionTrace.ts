import { useCallback, useEffect, useRef } from 'react';
import { useArcadeController } from '../context/ArcadeController';
import type { InputSource, MissionTrace, RunEvent, TraceFrame } from './runTelemetry';

export function useMissionTrace(readGame: () => Omit<TraceFrame, 'ms' | 'stick'> | null, game?: MissionTrace['game']) {
  const { input, mouseMode, status } = useArcadeController();
  const read = useRef(readGame);
  read.current = readGame;
  const controllerAvailable = useRef(false);
  controllerAvailable.current = !mouseMode && !!status.source;
  const trace = useRef<MissionTrace>({ frames: [], events: [], inputs: [] });
  const start = useRef(0);
  const finished = useRef(false);

  const markInput = useCallback((source: InputSource) => {
    if (!finished.current && !trace.current.inputs.includes(source)) trace.current.inputs.push(source);
  }, []);

  const sample = useCallback((time: number) => {
    const scene = read.current();
    if (!scene || finished.current) return;
    const { x, y } = input.current;
    trace.current.frames.push({ ...scene, ms: time, stick: controllerAvailable.current ? { x, y } : null });
  }, [input]);

  useEffect(() => {
    start.current = performance.now();
    finished.current = false;
    trace.current = { game, frames: [], events: [], inputs: [] };
    sample(0);
    const timer = window.setInterval(() => sample(performance.now() - start.current), 40);
    return () => window.clearInterval(timer);
  }, [game, sample]);

  const event = useCallback((record: Omit<RunEvent, 'ms'>) => {
    if (finished.current) return;
    const ms = performance.now() - start.current;
    sample(ms);
    markInput(record.source);
    trace.current.events.push({ ...record, ms });
  }, [markInput, sample]);

  const finish = useCallback(() => {
    sample(performance.now() - start.current);
    finished.current = true;
    return trace.current;
  }, [sample]);

  return { markInput, event, finish };
}
