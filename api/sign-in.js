import { withHostedAuth } from '../server/hosted-auth.js';

export default withHostedAuth((request, response) => {
  if (request.method !== 'GET') {
    response.writeHead(405, { Allow: 'GET' });
    return response.end();
  }
  response.writeHead(303, { Location: '/' });
  return response.end();
});
