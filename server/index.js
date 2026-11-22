import { createServer } from 'node:http';
import { loadEnvFile } from 'node:process';

try {
  loadEnvFile(new URL('./.env.local', import.meta.url));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const { handleRequest } = await import('./request-handler.js');

createServer((request, response) => handleRequest(request, response)).listen(3001, '127.0.0.1', () => {
  console.log('Run API listening on http://127.0.0.1:3001');
});
