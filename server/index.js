import { createServer } from 'node:http';

const maxBodyBytes = 2 * 1024 * 1024;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const databaseUrl = process.env.DATABASE_URL;
let pool;

if (databaseUrl) {
  const { Pool } = await import('pg');
  pool = new Pool({ connectionString: databaseUrl, connectionTimeoutMillis: 5000 });
  pool.on('error', (error) => console.error('Idle database connection failed', error.code));
} else {
  console.error('Set DATABASE_URL in server/.env.local to enable run storage.');
}

function reply(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(typeof body === 'string' ? { message: body } : body));
}

function isTrace(trace) {
  return trace != null && Array.isArray(trace.frames) && Array.isArray(trace.events)
    && Array.isArray(trace.inputs);
}

createServer(async (request, response) => {
  const [path, query] = request.url.split('?');
  const collection = path === '/api/runs';
  const id = path.startsWith('/api/runs/') ? path.slice('/api/runs/'.length) : '';
  if (!collection && !uuidPattern.test(id)) return reply(response, 404, 'Not found');
  if ((request.method === 'GET') || (!collection && request.method === 'DELETE')) {
    if (!pool) return reply(response, 503, 'Run storage is not configured');
    try {
      if (request.method === 'DELETE') {
        await pool.query('DELETE FROM public.arcade_runs WHERE id = $1', [id]);
        return reply(response, 200, 'Run deleted');
      }
      const metadata = 'id, ended_at AS "endedAt", age_group AS "ageGroup"';
      const traces = ', target_trace AS target, comet_trace AS comet';
      if (collection) {
        const columns = query === 'full=1' ? metadata + traces : metadata;
        const result = await pool.query(`SELECT ${columns} FROM public.arcade_runs ORDER BY ended_at DESC, id DESC`);
        return reply(response, 200, result.rows);
      }
      const result = await pool.query(`SELECT ${metadata}${traces} FROM public.arcade_runs WHERE id = $1`, [id]);
      return result.rows.length
        ? reply(response, 200, result.rows[0])
        : reply(response, 404, 'Run not found');
    } catch (error) {
      console.error('Run history request failed', error.code);
      return reply(response, 503, 'Run storage is unavailable');
    }
  }
  if (!collection || request.method !== 'POST') {
    response.setHeader('Allow', collection ? 'GET, POST' : 'GET, DELETE');
    return reply(response, 405, 'Method not allowed');
  }
  if (request.headers['content-type']?.split(';')[0] !== 'application/json') {
    return reply(response, 415, 'Expected application/json');
  }

  const chunks = [];
  let size = 0;
  let run;
  try {
    for await (const chunk of request) {
      size += chunk.length;
      if (size > maxBodyBytes) {
        response.setHeader('Connection', 'close');
        return reply(response, 413, 'Run exceeds the upload limit');
      }
      chunks.push(chunk);
    }
    run = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return reply(response, 400, 'Invalid JSON');
  }

  if (typeof run?.id !== 'string' || !uuidPattern.test(run.id)
    || typeof run.endedAt !== 'string' || !Number.isFinite(Date.parse(run.endedAt))
    || typeof run.ageGroup !== 'string' || run.ageGroup.length > 100
    || !isTrace(run.target) || !isTrace(run.comet)) {
    return reply(response, 400, 'Invalid run telemetry');
  }
  if (!pool) return reply(response, 503, 'Run storage is not configured');

  try {
    await pool.query(
      `INSERT INTO public.arcade_runs (id, ended_at, age_group, target_trace, comet_trace)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
      [run.id, new Date(run.endedAt), run.ageGroup, run.target, run.comet],
    );
    return reply(response, 200, 'Run saved');
  } catch (error) {
    console.error('Run insert failed', error.code);
    return reply(response, 503, 'Run storage is unavailable');
  }
}).listen(3001, '127.0.0.1', () => {
  console.log('Run API listening on http://127.0.0.1:3001');
});
