import { readFile, writeFile } from 'node:fs/promises';
import { analyze, toMarkdown } from './pulse.js';
const input = process.env['INPUT_INPUT'] || 'pulse-input.json';
const output = process.env['INPUT_OUTPUT'] || 'pulse-report.md';
const report = analyze(JSON.parse(await readFile(input, 'utf8')));
await writeFile(output, toMarkdown(report));
console.log(`OpenSource Pulse wrote ${output}`);
