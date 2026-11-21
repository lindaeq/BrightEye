CREATE TABLE IF NOT EXISTS public.arcade_runs (
  id uuid PRIMARY KEY,
  ended_at timestamptz NOT NULL,
  age_group text NOT NULL,
  target_trace jsonb NOT NULL,
  comet_trace jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS arcade_runs_ended_at_idx
  ON public.arcade_runs (ended_at DESC);
