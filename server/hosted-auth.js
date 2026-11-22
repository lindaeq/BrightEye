import { createHash, timingSafeEqual } from 'node:crypto';

function digest(value) {
  return createHash('sha256').update(value).digest();
}

export function withHostedAuth(handler) {
  return async (request, response) => {
    response.setHeader('Cache-Control', 'private, no-store');
    const password = process.env.BRIGHTEYE_OPERATOR_PASSWORD;
    if (!password?.trim()) {
      response.writeHead(503, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ message: 'Hosted access is not configured' }));
      return;
    }

    const token = /^Basic\s+(\S+)$/i.exec(request.headers.authorization ?? '')?.[1];
    const expected = Buffer.from(`operator:${password}`, 'utf8').toString('base64');
    if (!token || !timingSafeEqual(digest(token), digest(expected))) {
      response.writeHead(401, {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Basic realm="BrightEye", charset="UTF-8"',
      });
      response.end(JSON.stringify({ message: 'Sign in at /api/sign-in' }));
      return;
    }
    return handler(request, response);
  };
}
