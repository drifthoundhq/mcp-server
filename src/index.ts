#!/usr/bin/env node

import { DrifthoundClient } from './client.js';
import { runServer } from './server.js';

async function main(): Promise<void> {
  const baseUrl = process.env.DRIFTHOUND_API_URL;
  const apiToken = process.env.DRIFTHOUND_API_TOKEN;

  if (!baseUrl) {
    console.error('Error: DRIFTHOUND_API_URL environment variable is required');
    console.error('Example: DRIFTHOUND_API_URL=https://drifthound.example.com');
    process.exit(1);
  }

  if (!apiToken) {
    console.error('Error: DRIFTHOUND_API_TOKEN environment variable is required');
    console.error('Generate an API token in the DriftHound admin UI');
    process.exit(1);
  }

  const client = new DrifthoundClient(baseUrl, apiToken);

  await runServer(client);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
