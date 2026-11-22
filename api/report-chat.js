import { withHostedAuth } from '../server/hosted-auth.js';
import { handleRequest } from '../server/request-handler.js';

export default withHostedAuth((request, response) => handleRequest(request, response, '/api/report-chat'));
