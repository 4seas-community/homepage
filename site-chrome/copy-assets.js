#!/usr/bin/env node
import { mkdir, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
export async function copyAssets(destination) {
  await mkdir(destination, { recursive: true });
  await copyFile(new URL('./assets/logo.png', import.meta.url), resolve(destination, 'logo.png'));
}
if (!process.argv[2]) throw Error('Usage: 4seas-chrome-assets <public/site-chrome>');
await copyAssets(resolve(process.argv[2]));
