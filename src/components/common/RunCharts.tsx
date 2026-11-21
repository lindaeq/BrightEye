import { useState, type ReactNode } from 'react';
import type { RunTelemetry } from '../../utils/runTelemetry';
import type { getRunReview, OutlierLevel } from '../../utils/runOutliers';

type Series = { label: string; color: string; values: Array<number | null>; flags?: Array<OutlierLevel | null>; dash?: string };
const cyan = '#70edff';
const gold = '#fff082';
const pink = '#efa9dd';
const numberOrNull = (value: number | undefined) => typeof value === 'number' && Number.isFinite(value) ? value : null;

function RunChart({ title, description, changes, x, axis, unit, series, empty, showMeans = false, dots = false }: {
  title: string;
  description: string;
  changes: string;
  x: number[];
  axis: string;
  unit: string;
  series: Series[];
  empty: string;
  showMeans?: boolean;
  dots?: boolean;
}) {
  const [cursor, setCursor] = useState(0);
  const selected = Math.min(cursor, Math.max(0, x.length - 1));
  const peak = series[0].values.reduce<number>((best, value, index, values) =>
    value !== null && (best === -1 || Math.abs(value) > Math.abs(values[best] ?? 0)) ? index : best, -1);
  const values = series.flatMap((line) => line.values.filter((value): value is number => value !== null));
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values) || (min === 0 ? 1 : 0);
  const start = x[0] ?? 0;
  const end = x.at(-1) ?? start;
  const left = 65, right = 785, top = 12, bottom = 247;
  const plotX = (value: number) => end === start ? (left + right) / 2
    : left + (value - start) / (end - start) * (right - left);
  const plotY = (value: number) => bottom - (value - min) / (max - min) * (bottom - top);
  const midpoint = (min + max) / 2;
  const ticks = [...new Set([min, max, 0, ...(Math.abs(midpoint) >= (max - min) * 0.12 ? [midpoint] : [])])]
    .sort((a, b) => a - b);
  const xTicks = [...new Set([start, dots ? Math.floor((start + end) / 2) : (start + end) / 2, x.at(-1) ?? start])];
  const label = (value: number) => Number(value.toFixed(unit === '%' ? 1 : 0)).toString();
  const position = dots ? `Correct selection ${x[selected]}` : `${x[selected]?.toFixed(2)} s into the stage`;

  return (
    <figure className="run-chart">
      <figcaption><h3>{title}</h3><p>{description}</p><p className="input-hint">{changes}</p></figcaption>
      {values.length === 0 ? <p className="run-chart-empty">{empty}</p> : <>
        <svg viewBox="0 0 810 292" role="img" aria-label={`${title} plotted against ${axis}`}>
          {ticks.map((value) => (
            <g key={value} className="run-chart-grid">
              <line x1={left} x2={right} y1={plotY(value)} y2={plotY(value)} data-zero={value === 0} />
              <text x={left - 6} y={plotY(value) + 4} textAnchor="end">{label(value)}{unit === '%' ? '%' : ' ms'}</text>
            </g>
          ))}
          {xTicks.map((value) => <text key={value} x={plotX(value)} y={266} textAnchor="middle">
            {Number(value.toFixed(1))}
          </text>)}
          <text x={(left + right) / 2} y={286} textAnchor="middle">{axis}</text>
          <line className="run-chart-cursor" x1={plotX(x[selected])} x2={plotX(x[selected])} y1={top} y2={bottom} />
          {series.map((line) => {
            const marks: ReactNode[] = [];
            let path = '';
            let drawing = false;
            line.values.forEach((value, i) => {
              if (value === null) {
                drawing = false;
                return;
              }
              const px = plotX(x[i]), py = plotY(value);
              const flag = line.flags?.[i];
              path += `${drawing ? 'L' : 'M'}${px.toFixed(2)},${py.toFixed(2)}`;
              if (i === selected || flag || dots || !drawing && line.values[i + 1] == null) {
                marks.push(<circle key={i} cx={px} cy={py} r={i === selected ? 6 : flag ? 5 : 3} fill={line.color} data-review={flag}>
                  <title>{`${line.label}: ${label(value)}${unit === '%' ? '%' : ' ms'}${flag ? ` (${flag} outlier)` : ''}`}</title>
                </circle>);
              }
              drawing = true;
            });
            return <g key={line.label}>
              <path d={path} fill="none" stroke={line.color} strokeWidth={2} strokeDasharray={line.dash} />
              {marks}
            </g>;
          })}
        </svg>
        <div className="run-chart-inspector">
          <div className="operator-panel-heading">
            <label htmlFor="run-chart-position">{position}</label>
            {peak >= 0 && x.length > 1 && <button type="button" className="arcade-text-button"
              onClick={() => setCursor(peak)}>{dots ? 'Find slowest selection' : 'Find largest reading'}</button>}
          </div>
          <input id="run-chart-position" type="range" min={0} max={Math.max(0, x.length - 1)}
            value={selected} onChange={(event) => setCursor(Number(event.target.value))}
            aria-valuetext={position} disabled={x.length < 2} />
          <dl>
            {series.map((line) => {
              const value = line.values[selected];
              const flag = line.flags?.[selected];
              return <div key={line.label}>
                <dt><span style={{ background: line.color }} />{line.label}</dt>
                <dd>{value == null ? 'No sample' : `${label(value)}${unit === '%' ? '%' : ' ms'}`}
                  {flag && <small data-review={flag}>{flag === 'large' ? 'Large outlier' : 'Unusual for this run'}</small>}
                </dd>
              </div>;
            })}
          </dl>
        </div>
        {showMeans && <ul className="run-chart-legend">
          {series.map((line) => {
            const samples = line.values.filter((value): value is number => value !== null);
            const average = samples.length ? samples.reduce((sum, value) => sum + value, 0) / samples.length : null;
            return <li key={line.label}><span style={{ background: line.color }} />
              {line.label} <b>{average === null ? '—' : `${label(average)} ms avg · n=${samples.length}`}</b>
            </li>;
          })}
        </ul>}
      </>}
    </figure>
  );
}

export function RunCharts({ run, review }: { run: RunTelemetry; review: ReturnType<typeof getRunReview> }) {
  const frames = run.comet.frames;
  const seconds = frames.map(({ ms }) => ms / 1000);
  const hits = run.target.events.filter(({ kind }) => kind === 'target-hit');

  const [selected, setSelected] = useState<'separation' | 'lead' | 'deviation' | 'timing'>('separation');
  const hasTrail = run.comet.game === 'steady-path';
  const active = (selected === 'lead' || selected === 'deviation') && !hasTrail ? 'separation' : selected;
  const views = [
    { id: 'separation', label: 'Eye–hand separation' },
    ...(hasTrail ? [{ id: 'lead', label: 'Gaze lead' }, { id: 'deviation', label: 'Off-trail deviation' }] as const : []),
    { id: 'timing', label: 'Response timing' },
  ] as const;

  return (
    <section className="operator-workspace" aria-label="Run graphs">
      <div className="operator-chart-switch" role="group" aria-label="Choose a graph">
        {views.map(({ id, label }) => (
          <button key={id} type="button" aria-pressed={active === id} onClick={() => setSelected(id)}>
            {label}
          </button>
        ))}
      </div>
      {active === 'separation' && (
        <RunChart title="Eye–hand separation" description="How far apart gaze and the ship were, as a percentage of the arena’s diagonal. Zero means they overlapped."
          changes="Peaks mean gaze and ship were farther apart. That can happen when looking ahead to a turn or looking away from the trail. Use Gaze lead to see which was ahead."
          x={seconds} axis="Elapsed seconds" unit="%" empty="No usable gaze samples in this stage."
          series={[{ label: 'Separation', color: cyan, ...review.separation }]} />
      )}
      {active === 'lead' && (
        <RunChart title="Gaze lead along the trail" description="Above zero, gaze was ahead of the ship. Below zero, it was behind. A reading of +10% means gaze was one-tenth of the full trail length ahead."
          changes="Crossing zero means gaze went from ahead to behind, or the reverse. Gaps appear when gaze or ship position is too far from the trail for this comparison."
          x={seconds} axis="Elapsed seconds" unit="%" empty="No samples with both gaze and ship near the trail."
          series={[{ label: 'Gaze lead', color: gold, values: frames.map(({ trail }) => numberOrNull(trail?.eyeLeadPct)) }]} />
      )}
      {active === 'deviation' && (
        <RunChart title="Off-trail deviation" description="How far the ship was beyond the trail edge, as a percentage of the arena’s diagonal. Zero means the ship was inside the trail."
          changes="A spike shows a brief excursion. A stretch above zero shows the ship stayed outside the trail. Returning to zero marks re-entry."
          x={seconds} axis="Elapsed seconds" unit="%" empty="No movement samples in this stage."
          series={[{ label: 'Off-trail deviation', color: cyan, ...review.deviation }]} />
      )}
      {active === 'timing' && (
        <RunChart title="Response timing" description="Each point is one correct selection. Flash to click is the total time. Flash to gaze ends when the tracker first sees gaze enter the target corner. Gaze to click is the remaining time."
          changes="Peaks show slower selections. Compare both phases at the same selection to see where more time elapsed. Each average uses the available samples for that line."
          x={hits.map((_, index) => index + 1)} axis="Correct selection" unit="ms" empty="No timed correct selections in this run." showMeans dots
          series={[
            { label: 'Flash to click', color: pink, ...review.response },
            { label: 'Flash to gaze', color: cyan, dash: '7 4', values: hits.map(({ gazeLatencyMs }) => numberOrNull(gazeLatencyMs)) },
            { label: 'Gaze to click', color: gold, dash: '2 4', values: hits.map(({ eyeToHandMs }) => numberOrNull(eyeToHandMs)) },
          ]} />
      )}
      <div className="run-review-key">
        <span data-review="unusual">Unusual sample</span>
        <span data-review="large">Large outlier</span>
        <p>Outlines mark readings unusually high for this run. Missing measurements appear as gaps.</p>
      </div>
    </section>
  );
}
