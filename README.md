# Hack Western 13 arcade

## Save completed runs to Tiger Cloud

1. In the Tiger Console SQL editor for your development service, run [the arcade runs migration](server/001_arcade_runs.sql).
2. Create a PostgreSQL login for the API with `USAGE` on the `public` schema and `SELECT, INSERT, DELETE` on `public.arcade_runs`. Supply that login's TLS-enabled PostgreSQL URI as `DATABASE_URL` in `server/.env.local`. This file is gitignored. Use `sslmode=verify-full` in the connection URI.
3. With Node.js 22 or later, run `npm install --prefix server` and `npm run start --prefix server` from the repo root.
4. Run `npm install` and `npm run dev` from the repo root in another terminal. Open the localhost URL printed by Vite.

Finish both missions and watch the upload popup. Open Operator → Run history to select a saved replay or delete a run. The API binds to localhost and Vite forwards requests to it during development. To verify the write in Tiger Console, run:

```sql
SELECT id, ended_at FROM public.arcade_runs ORDER BY ended_at DESC LIMIT 5;
```

## Use the Raspberry Pi eye tracker

On the Pi, install Python packages `opencv-python`, `numpy`, and `flask` in your Python environment. Run `python3 kiosk_eyetrack.py` with the camera attached. The tracker serves live gaze telemetry and a camera preview on port 8080.

If Vite runs on a different computer, set `QNX_TRACKER_URL` to `http://<pi-ip>:8080` before starting Vite. In PowerShell, use `$env:QNX_TRACKER_URL = 'http://<pi-ip>:8080'`. When both services run on the Pi, Vite uses port 8080 on localhost by default.

Check **Operator → Hardware diagnostics → Eye tracker** for the connection status. Complete a run to see its gaze metrics and path in Operator. Runs saved before eye tracking still replay in the same history. Tiger stores gaze samples in the existing mission trace columns.

The browser can keep using the Arduino controller through Web Serial. If your Pi setup also needs serial gaze output, install `pyserial` and set `EYE_TRACKER_SERIAL_PORT` to a dedicated serial port before launching the tracker.
