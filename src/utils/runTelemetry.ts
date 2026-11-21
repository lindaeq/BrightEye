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
};

export type RunEvent = {
  ms: number;
  kind: 'target-hit' | 'decoy-hit' | 'miss' | 'star-caught';
  latencyMs?: number;
  source: InputSource;
};

export type MissionTrace = {
  frames: TraceFrame[];
  events: RunEvent[];
  inputs: InputSource[];
};

export type RunTelemetry = {
  id: number;
  endedAt: string;
  ageGroup: string;
  target: MissionTrace;
  comet: MissionTrace;
};

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
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
  const latencies = hits.flatMap((event) => event.latencyMs === undefined ? [] : [event.latencyMs]).sort((a, b) => a - b);
  const middle = Math.floor(latencies.length / 2);
  const median = latencies.length === 0 ? null : latencies.length % 2
    ? latencies[middle]
    : (latencies[middle - 1] + latencies[middle]) / 2;

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
  const meanGazeDeviationPct = totalEyeFrames > 0 ? (gazeDeviationSum / totalEyeFrames) * 100 : null;

  const continuousSteering = !run.comet.inputs.includes('pointer');
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
    excessiveCount,
    meanGazeDeviationPct,
    hasEyeData: totalEyeFrames > 10,
  };
}

export function downloadRunSummaries(runs: RunTelemetry[]) {
  const header = [
    'Run', 'Ended (UTC)', 'Age band', 'Inputs', 'Hits', 'Shots', 'Decoy hits', 'Median target-to-hit (ms)',
    'Stars caught', 'Path efficiency (%)', 'Path deviation (%)', 'Active stick change (%)',
    'Visual Focus (%)', 'Excessive Eye Jumps', 'Mean Gaze Error (%)'
  ];
  const rows = runs.map((run) => {
    const stats = summarizeRun(run);
    const inputs = [...new Set([...run.target.inputs, ...run.comet.inputs])];
    return [
      run.id, 
      run.endedAt, 
      run.ageGroup, 
      inputs.join(' + '), 
      stats.hits, 
      stats.shots, 
      stats.decoys, 
      stats.median,
      stats.stars, 
      stats.pathEfficiency?.toFixed(1), 
      stats.pathDeviation?.toFixed(1), 
      stats.stickChange?.toFixed(1),
      stats.visualFocusPct !== null ? stats.visualFocusPct.toFixed(1) : '—',
      stats.excessiveCount,
      stats.meanGazeDeviationPct !== null ? stats.meanGazeDeviationPct.toFixed(1) : '—'
    ];
  });
  const csv = [header, ...rows].map((row) => row.map((cell) => '"' + String(cell ?? '').replace(/"/g, '""') + '"').join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'aeroneuro-neuro-motor-summary.csv';
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
