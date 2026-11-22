# brighteyed

## 30-second gameplay

- **Odd-One-Out Corners (15 seconds)** shows four stars. Use the joystick and action button, arrow keys and Space, or click or tap the star with the different color. Each selection starts a new round.
- **Steady Path (up to 15 seconds)** starts the ship at the beginning of a winding trail. Use the joystick, arrow keys, or drag to collect the stars in order. The stage ends when you collect the final star or time runs out. Brief red distractors appear off the trail at random intervals.

Operator history and CSV export include wrong-corner selections, flash-to-gaze, eye-to-hand time, off-trail deviation, joystick jitter, and signed gaze lead. Gaze timing uses the browser receipt time of live tracker samples, so polling and network delay affect the measurement. Gaze lead compares gaze and ship progress when both are near the trail. The joystick jitter estimate uses short-term changes in the sampled, active stick signal. These are gameplay measurements for a prototype.

## Save completed runs to Tiger Cloud

1. In the Tiger Console SQL editor for your development service, run [the arcade runs migration](server/001_arcade_runs.sql).
2. Create a PostgreSQL login for the API with `USAGE` on the `public` schema and `SELECT, INSERT, DELETE` on `public.arcade_runs`. Supply that login's TLS-enabled PostgreSQL URI as `DATABASE_URL` in `server/.env.local`. This file is gitignored. Use `sslmode=verify-full` in the connection URI.
3. With Node.js 20.12 or later, run `npm install --prefix server` and `npm run start --prefix server` from the repo root.
4. Run `npm install` and `npm run dev` from the repo root in another terminal. Open the localhost URL printed by Vite.

Finish both missions and watch the upload popup. Open Operator → Run history to select a saved replay or delete a run. The API binds to localhost and Vite forwards requests to it during development. To verify the write in Tiger Console, run:

```sql
SELECT id, ended_at FROM public.arcade_runs ORDER BY ended_at DESC LIMIT 5;
```

## Use the Raspberry Pi eye tracker

On the Pi, install Python packages `opencv-python`, `numpy`, and `flask` in your Python environment. Run `python3 kiosk_eyetrack.py` with the camera attached. The tracker serves live gaze telemetry and a camera preview on port 8080.

To enable eye tracking, set `QNX_TRACKER_URL` before starting Vite. In PowerShell, use `$env:QNX_TRACKER_URL = 'http://<pi-ip>:8080'`. Use `http://127.0.0.1:8080` when Vite runs on the Pi. Leave the variable unset to play and save runs without the tracker.

If Vite runs on your Mac and Flask runs on the Pi, open the tunnel in a Mac terminal and leave it running:

```sh
ssh -N -o ExitOnForwardFailure=yes -L 8080:127.0.0.1:8080 '<pi-user>@<pi-address>'
```

Set `QNX_TRACKER_URL=http://127.0.0.1:8080` in the repository's `.env.local`, then start or restart `npm run dev` in another Mac terminal. Open the Vite URL (usually `http://localhost:5173`). Port 8080 serves the tracker preview directly. To check the website's proxy, open `http://localhost:5173/qnx/telemetry`.

Check **Operator → Hardware diagnostics → Eye tracker** for the connection status. Complete a run to see its gaze metrics and path in Operator. Runs saved before eye tracking still replay in the same history. Tiger stores gaze samples in the existing mission trace columns.

The browser can keep using the Arduino controller through Web Serial. If your Pi setup also needs serial gaze output, install `pyserial` and set `EYE_TRACKER_SERIAL_PORT` to a dedicated serial port before launching the tracker.

## Parent report chat

At the top of Operator view, select **Summarize this report** or submit a question.
The chat sends the displayed scores and recent chat messages to Gemini when
someone asks a question.

Set `GEMINI_API_KEY` in the gitignored `server/.env.local` and run
`npm run start --prefix server` alongside `npm run dev`. Chat works without
PostgreSQL. It uses `gemini-3.1-flash-lite` by default. Set `GEMINI_MODEL` in the
same file to override it with a compatible Gemini model. For a hosted build,
route `/api/report-chat` to the Node API.
