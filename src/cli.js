#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { analyze, toMarkdown } from './pulse.js';
const input = process.argv[2] || 'pulse-input.json';
const output = process.argv[3] || 'pulse-report.md';
const report = analyze(JSON.parse(await readFile(input, 'utf8')));
await writeFile(output, toMarkdown(report));
console.log(`Wrote ${output}`);
