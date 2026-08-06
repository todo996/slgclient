import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

const root = resolve('assets');
const outputDir = resolve('artifacts');
const outputPath = join(outputDir, 'vietnamese-audit.json');
const supportedExtensions = new Set(['.ts', '.json', '.prefab', '.scene', '.fire']);
const cjkPattern = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]+/g;

const occurrences = [];
const unique = new Map();

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath);
      continue;
    }

    if (!supportedExtensions.has(extname(entry.name).toLowerCase())) {
      continue;
    }

    const content = await readFile(fullPath, 'utf8');
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      const matches = line.match(cjkPattern) || [];
      for (const text of matches) {
        const item = {
          text,
          file: relative(process.cwd(), fullPath),
          line: index + 1,
          context: line.trim().slice(0, 300),
        };
        occurrences.push(item);

        const current = unique.get(text) || { text, count: 0, examples: [] };
        current.count += 1;
        if (current.examples.length < 5) {
          current.examples.push({ file: item.file, line: item.line, context: item.context });
        }
        unique.set(text, current);
      }
    });
  }
}

await walk(root);
await mkdir(outputDir, { recursive: true });

const report = {
  generatedAt: new Date().toISOString(),
  scannedRoot: relative(process.cwd(), root),
  uniqueCount: unique.size,
  occurrenceCount: occurrences.length,
  uniqueStrings: [...unique.values()].sort((a, b) => b.count - a.count || a.text.localeCompare(b.text)),
  occurrences,
};

await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`Đã phát hiện ${report.uniqueCount} chuỗi Hán tự với ${report.occurrenceCount} lần xuất hiện.`);
console.log(`Báo cáo: ${relative(process.cwd(), outputPath)}`);

for (const item of report.uniqueStrings.slice(0, 100)) {
  const example = item.examples[0];
  console.log(`${item.count}\t${item.text}\t${example.file}:${example.line}`);
}

if (process.env.FAIL_ON_CJK === 'true' && report.uniqueCount > 0) {
  process.exitCode = 1;
}
