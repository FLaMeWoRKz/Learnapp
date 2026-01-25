#!/usr/bin/env node
/**
 * Creates .env from .env.example if .env does not exist.
 * Run from backend: node scripts/setup-env.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env');
const examplePath = path.join(root, '.env.example');

if (fs.existsSync(envPath)) {
  process.exit(0);
}

if (!fs.existsSync(examplePath)) {
  console.warn('⚠️  .env.example not found. Skipping setup.');
  process.exit(0);
}

fs.copyFileSync(examplePath, envPath);
console.log('✅ Created .env from .env.example (STORAGE_MODE=local for testing)');
