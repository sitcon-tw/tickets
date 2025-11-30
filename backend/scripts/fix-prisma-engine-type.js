#!/usr/bin/env node
import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prismaClientPath = join(__dirname, '../node_modules/.prisma/client/index.js');

try {
  let content = await readFile(prismaClientPath, 'utf-8');

  // Check if engineType is already set
  if (content.includes('"engineType"')) {
    console.log('✓ Prisma client already has engineType configured');
    process.exit(0);
  }

  // Add engineType to config object
  content = content.replace(
    /("engineVersion":\s*"[^"]+",)/,
    '$1\n  "engineType": "binary",'
  );

  await writeFile(prismaClientPath, content, 'utf-8');
  console.log('✓ Fixed Prisma client engineType configuration');
} catch (error) {
  console.error('✗ Failed to fix Prisma client:', error.message);
  process.exit(1);
}
