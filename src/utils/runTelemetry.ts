import type { getRunReview } from './runOutliers';

export type Point = { x: number; y: number };
export type InputSource = 'joystick' | 'keyboard' | 'pointer' | 'eye';
export type Mission = 'target' | 'comet';

export type TraceFrame = {
  ms: number;
  player: Point;
  target: Point & { kind: 'round' | 'decoy' | 'star' };
  stick: Point | null;
  eye?: Point | null;           // Normalized 0.0 - 1.0 gaze coordinates
  saccade?: boolean;            // Rapid saccadic jump
  focused?: boolean;            // True if gaze is actively focused on needed game target
  excessive?: boolean;          // True if eye movement is excessive, wandering, or on decoy
  trail?: { deviationPct: number; eyeLeadPct?: number; joystick: boolean };
  distractor?: Point;
};

export type RunEvent = {
  ms: number;
  kind: 'target-hit' | 'decoy-hit' | 'miss' | 'star-caught';
  latencyMs?: number;
  eyeToHandMs?: number;
  gazeLatencyMs?: number;
  source: InputSource;
};

export type MissionTrace = {
  game?: 'odd-corners' | 'steady-path';
  simulatedGaze?: boolean;
  frames: TraceFrame[];
  events: RunEvent[];
  inputs: InputSource[];
};

export type RunTelemetry = {
  id: string;
  endedAt: string;
  ageGroup: string;
  playerName?: string | null;
  target: MissionTrace;
  comet: MissionTrace;
};

export function isDemoRun(run: RunTelemetry) {
  return !!(run.target.simulatedGaze || run.comet.simulatedGaze);
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function medianOf(values: number[]) {
  values.sort((a, b) => a - b);
  const middle = Math.floor(values.length / 2);
  return values.length === 0 ? null : values.length % 2
    ? values[middle] : (values[middle - 1] + values[middle]) / 2;
}

function lineDistance(point: Point, start: Point, end: Point) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return distance(point, start);
  const progress = Math.min(1, Math.max(0, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  return distance(point, { x: start.x + progress * dx, y: start.y + progress * dy });
}

export function summarizeRun(run: RunTelemetry) {
  const shots = run.target.events;
  const hits = shots.filter((event) => event.kind === 'target-hit');
  const median = medianOf(hits.flatMap((event) => event.latencyMs === undefined ? [] : [event.latencyMs]));
  const eyeToHandMedian = medianOf(hits.flatMap((event) => event.eyeToHandMs === undefined ? [] : [event.eyeToHandMs]));
  const gazeLatencyMedian = medianOf(shots.flatMap((event) => event.gazeLatencyMs === undefined ? [] : [event.gazeLatencyMs]));
  const steadyPath = run.comet.game === 'steady-path';
  const trailFrames = run.comet.frames.flatMap((frame) => frame.trail ? [frame.trail] : []);
  const trailDeviation = trailFrames.length
    ? trailFrames.reduce((sum, frame) => sum + frame.deviationPct, 0) / trailFrames.length : null;
  const eyeHandLead = medianOf(trailFrames.flatMap((frame) => frame.eyeLeadPct === undefined ? [] : [frame.eyeLeadPct]));
  let jitterSquares = 0;
  let jitterSamples = 0;
  if (steadyPath) {
    const frames = run.comet.frames;
    for (let i = 2; i < frames.length; i++) {
      const [first, middle, last] = [frames[i - 2], frames[i - 1], frames[i]];
      const a = first.stick, b = middle.stick, c = last.stick;
      const before = middle.ms - first.ms, after = last.ms - middle.ms;
      if (!a || !b || !c || !first.trail?.joystick || !middle.trail?.joystick || !last.trail?.joystick ||
        before < 25 || before > 65 || after < 25 || after > 65 ||
        Math.min(Math.hypot(a.x, a.y), Math.hypot(b.x, b.y), Math.hypot(c.x, c.y)) <= 0.2) continue;
      const fraction = before / (before + after);
      jitterSquares += (b.x - (a.x + (c.x - a.x) * fraction)) ** 2 +
        (b.y - (a.y + (c.y - a.y) * fraction)) ** 2;
      jitterSamples++;
    }
  }

  // Each capture closes a leg. Frames at the capture timestamp keep the old star.
  const captures = run.comet.events.filter((event) => event.kind === 'star-caught');
  let startIndex = 0;
  let meanDeviationSum = 0;
  let directDistance = 0;
  let traveledDistance = 0;
  let measuredLegs = 0;
  let angleSum = 0;
  let angleCount = 0;
  for (const event of captures) {
    const start = startIndex;
    while (startIndex < run.comet.frames.length && run.comet.frames[startIndex].ms <= event.ms) startIndex++;
    const frames = run.comet.frames.slice(start, startIndex);
    if (frames.length < 3 || frames.some((frame, index) => index > 0 && frame.ms - frames[index - 1].ms > 150)) continue;
    const from = frames[0].player;
    const to = frames[frames.length - 1].player;
    let traveled = 0;
    let deviation = 0;
    let movingSamples = 0;
    let previousHeading: number | null = null;
    for (let index = 1; index < frames.length; index++) {
      const step = distance(frames[index - 1].player, frames[index].player);
      if (!step) continue;
      traveled += step;
      if (step >= 0.002) {
        const heading = Math.atan2(frames[index].player.y - frames[index - 1].player.y,
          frames[index].player.x - frames[index - 1].player.x);
        if (previousHeading !== null) {
          const difference = Math.abs(heading - previousHeading);
          angleSum += Math.min(difference, 2 * Math.PI - difference);
          angleCount++;
        }
        previousHeading = heading;
      }
      deviation += lineDistance(frames[index].player, from, frames[0].target);
      movingSamples++;
    }
    if (!movingSamples) continue;
    directDistance += distance(from, to);
    traveledDistance += traveled;
    meanDeviationSum += deviation / movingSamples;
    measuredLegs++;
  }

  const stickInputs = new Set([...run.target.inputs, ...run.comet.inputs]);
  let stickChanges = 0;
  let changeSquares = 0;
  for (const trace of [run.target, run.comet]) {
    for (let index = 1; index < trace.frames.length; index++) {
      const { ms, stick } = trace.frames[index];
      const previous = trace.frames[index - 1];
      if (!stick || !previous.stick || ms - previous.ms < 25 || ms - previous.ms > 70 ||
          Math.hypot(stick.x, stick.y) <= 0.2 || Math.hypot(previous.stick.x, previous.stick.y) <= 0.2) continue;
      changeSquares += distance(stick, previous.stick) ** 2;
      stickChanges++;
    }
  }

  // Eye movement & focus analytics
  let totalEyeFrames = 0;
  let focusedFrames = 0;
  let excessiveCount = 0;
  let gazeDeviationSum = 0;

  for (const trace of [run.target, run.comet]) {
    for (const frame of trace.frames) {
      if (frame.eye) {
        totalEyeFrames++;
        if (frame.focused) focusedFrames++;
        if (frame.excessive) excessiveCount++;
        gazeDeviationSum += distance(frame.eye, frame.target);
      }
    }
  }

  const visualFocusPct = totalEyeFrames > 0 ? (focusedFrames / totalEyeFrames) * 100 : null;
  const meanGazeDeviationPct = totalEyeFrames > 0 ? (gazeDeviationSum / totalEyeFrames / Math.SQRT2) * 100 : null;

  const continuousSteering = !steadyPath && !run.comet.inputs.includes('pointer');
  return {
    hits: hits.length,
    shots: shots.length,
    decoys: shots.filter((event) => event.kind === 'decoy-hit').length,
    median,
    stars: captures.length,
    pathEfficiency: continuousSteering && traveledDistance > 0 ? directDistance / traveledDistance * 100 : null,
    pathDeviation: continuousSteering && measuredLegs > 0 ? meanDeviationSum / measuredLegs / Math.SQRT2 * 100 : null,
    meanTurnDegrees: continuousSteering && angleCount > 0 ? angleSum / angleCount * 180 / Math.PI : null,
    stickChange: stickInputs.has('joystick') && stickChanges > 0 ? Math.sqrt(changeSquares / stickChanges) * 50 : null,
    // Eye Tracking Metrics
    visualFocusPct,
    excessiveCount: totalEyeFrames ? excessiveCount : null,
    meanGazeDeviationPct,
    eyeToHandMedian,
    gazeLatencyMedian,
    trailDeviation,
    eyeHandLead,
    joystickJitter: jitterSamples > 0 ? Math.sqrt(jitterSquares / jitterSamples) * 50 : null,
    hasEyeData: totalEyeFrames > 10,
  };
}

export function downloadRunRecord(
  run: RunTelemetry,
  stats: ReturnType<typeof summarizeRun>,
  review: ReturnType<typeof getRunReview>,
) {
  const measurements: [string, string | number | null | undefined][] = [
    ['Name', run.playerName],
    ['Age group', run.ageGroup],
    ['Correct selections', stats.hits],
    ['Selection attempts', stats.shots],
    [run.target.game === 'odd-corners' ? 'Wrong-corner clicks' : 'Decoy hits', stats.decoys],
    ['Median flash-to-click (ms)', stats.median],
    ['Median flash-to-gaze (ms)', stats.gazeLatencyMedian],
    ['Median gaze-to-click (ms)', stats.eyeToHandMedian],
    ['Stars caught', stats.stars],
    ['Mean off-trail deviation (% arena diagonal)', stats.trailDeviation],
    ['Joystick jitter (% full axis range)', stats.joystickJitter],
    ['Median gaze lead (% of trail)', stats.eyeHandLead],
    ['Path efficiency (%)', stats.pathEfficiency],
    ['Path deviation (% arena diagonal)', stats.pathDeviation],
    ['Mean heading change (degrees)', stats.meanTurnDegrees],
    ['Active stick change (% full axis range)', stats.stickChange],
    ['Visual focus (%)', stats.visualFocusPct],
    ['Excessive gaze samples', stats.excessiveCount],
    ['Mean gaze error (% arena diagonal)', stats.meanGazeDeviationPct],
  ];
  const reviewedMeasurements = [
    ['Eye–hand separation', review.separation.flags],
    ['Off-trail deviation', review.deviation.flags],
    ['Flash-to-click time', review.response.flags],
  ] as const;
  for (const [label, flags] of reviewedMeasurements) {
    measurements.push(
      [`${label} unusual samples`, flags.filter((flag) => flag === 'unusual').length],
      [`${label} large outliers`, flags.filter((flag) => flag === 'large').length],
    );
  }
  const rows = [measurements.map(([label]) => label), measurements.map(([, value]) => value)];
  const csv = rows.map((row) => row.map((cell) => {
    // Spreadsheet apps can interpret user-provided text as a formula despite CSV quoting.
    const raw = String(cell ?? '');
    const safe = typeof cell === 'string' && /^[\s]*[=+@-]/.test(raw) ? "'" + raw : raw;
    return '"' + safe.replace(/"/g, '""') + '"';
  }).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `BrightEye-run-${run.id}.csv`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
