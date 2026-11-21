import type { RunTelemetry, summarizeRun } from './runTelemetry';
import type { getRunReview } from './runOutliers';
import { checkpoints } from './missionGames';

export function summarizeRunForOperator(
  run: RunTelemetry,
  stats: ReturnType<typeof summarizeRun>,
  review: ReturnType<typeof getRunReview>,
) {
  const observations: string[] = [];
  if (stats.shots > 0) observations.push(
    `The player made ${stats.hits} correct selections out of ${stats.shots} attempts (${Math.round(stats.hits / stats.shots * 100)}%).`,
  );
  if (run.comet.game === 'steady-path') {
    const movement = review.deviation.values.filter((value) => value !== null && Number.isFinite(value));
    const inside = movement.filter((distance) => distance === 0).length;
    const completion = stats.stars >= checkpoints.length
      ? 'The player completed the trail.'
      : `The player collected ${stats.stars} of ${checkpoints.length} trail stars.`;
    observations.push(completion + (movement.length
      ? ` The ship stayed inside the trail for ${Math.round(inside / movement.length * 100)}% of measured samples.` : ''));
  } else if (stats.stars > 0) {
    observations.push(`The player collected ${stats.stars} ${stats.stars === 1 ? 'star' : 'stars'} in the movement stage.`);
  }
  const paired = run.target.events.flatMap((event) => {
    if (event.kind !== 'target-hit' || event.gazeLatencyMs == null || event.eyeToHandMs == null
      || !Number.isFinite(event.gazeLatencyMs) || !Number.isFinite(event.eyeToHandMs)) return [];
    return [{ gaze: event.gazeLatencyMs, hand: event.eyeToHandMs }];
  });
  if (paired.length >= 3) {
    const gaze = Math.round(paired.reduce((sum, sample) => sum + sample.gaze, 0) / paired.length);
    const hand = Math.round(paired.reduce((sum, sample) => sum + sample.hand, 0) / paired.length);
    let interpretation = '';
    if (hand - gaze >= 50) interpretation = ' In those trials, more time elapsed after the recorded gaze reached the target. That interval can include deciding, steering, and pressing.';
    if (gaze - hand >= 50) interpretation = ' In those trials, more time elapsed before the tracker recorded gaze at the target.';
    observations.push(`Across ${paired.length} correct selections with both timings, gaze reached the target in ${gaze} ms on average, followed by ${hand} ms to select it.${interpretation}`);
  } else if (stats.median !== null) {
    observations.push(`A typical correct selection took ${Math.round(stats.median)} ms (median). There were too few paired gaze and click timings to compare the two parts of the response.`);
  } else {
    observations.push('There were no timed correct selections to summarize.');
  }

  const leadCount = run.comet.frames.filter((frame) => Number.isFinite(frame.trail?.eyeLeadPct)).length;
  if (run.comet.game === 'steady-path' && leadCount >= 8 && stats.eyeHandLead !== null) {
    const lead = Math.round(stats.eyeHandLead * 10) / 10;
    observations.push(lead === 0
      ? `Gaze and ship were at roughly the same point on the trail in the median of ${leadCount} comparable samples.`
      : `Gaze was typically ${Math.abs(lead)}% of the trail length ${lead > 0 ? 'ahead of' : 'behind'} the ship (median of ${leadCount} comparable samples). This describes position along the trail.`);
  } else if (run.comet.game === 'steady-path') {
    observations.push('There were too few samples with both gaze and ship near the trail to describe whether gaze led or lagged.');
  }

  const largeSeparation = review.separation.flags.filter((level) => level === 'large').length;
  const largeDeviation = review.deviation.flags.filter((level) => level === 'large').length;
  const largeResponse = review.response.flags.filter((level) => level === 'large').length;
  const spikes = [
    largeSeparation && `${largeSeparation} eye–hand separation ${largeSeparation === 1 ? 'sample' : 'samples'}`,
    largeDeviation && `${largeDeviation} off-trail ${largeDeviation === 1 ? 'sample' : 'samples'}`,
    largeResponse && `${largeResponse} response ${largeResponse === 1 ? 'time' : 'times'}`,
  ].filter(Boolean);
  if (spikes.length) observations.push(`Check the red outlines in the graphs for ${spikes.join(', ')}. Try another run with the same controls to see whether the pattern repeats.`);

  return observations;
}
