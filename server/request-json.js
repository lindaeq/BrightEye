export class BodyTooLargeError extends Error {}

export async function readJson(request, limit) {
  if (Number(request.headers['content-length']) > limit) throw new BodyTooLargeError();

  // Vercel can provide an already parsed body. The local HTTP server streams it.
  const body = request.body;
  if (body !== undefined) {
    if (typeof body === 'string' || Buffer.isBuffer(body)) {
      if (Buffer.byteLength(body) > limit) throw new BodyTooLargeError();
      return JSON.parse(body.toString());
    }
    if (Buffer.byteLength(JSON.stringify(body)) > limit) throw new BodyTooLargeError();
    return body;
  }

  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) throw new BodyTooLargeError();
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
