import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, relative, resolve, sep } from 'node:path';

const root = resolve('assets');
const i18nRoot = resolve('assets/scripts/i18n');
const outputDir = resolve('artifacts');
const outputPath = join(outputDir, 'vietnamese-audit.json');
const supportedExtensions = new Set(['.ts', '.json', '.prefab', '.scene', '.fire']);
const cjkSource = '[\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff]';
const cjkPattern = new RegExp(`${cjkSource}+`, 'g');
const translationKeyPattern = new RegExp(`["']([^"'\\n]*${cjkSource}[^"'\\n]*)["']\\s*:`, 'g');

const translationKeys = new Set();
const occurrences = [];
const unique = new Map();

function preserveLines(value) {
  return value.replace(/[^\n]/g, ' ');
}

function stripTypeScriptComments(content) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, preserveLines)
    .replace(/(^|[^:\\])\/\/.*$/gm, '$1');
}

function isInside(parent, child) {
  const normalizedParent = parent.endsWith(sep) ? parent : `${parent}${sep}`;
  return child === parent || child.startsWith(normalizedParent);
}

async function collectTranslationKeys(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      await collectTranslationKeys(fullPath);
      continue;
    }
    if (extname(entry.name).toLowerCase() !== '.ts') {
      continue;
    }

    const content = await readFile(fullPath, 'utf8');
    for (const match of content.matchAll(translationKeyPattern)) {
      translationKeys.add(match[1]);
    }
  }
}

function getMappingStatus(text) {
  if (translationKeys.has(text)) {
    return 'exact';
  }

  let remaining = text;
  const phraseKeys = [...translationKeys]
    .filter(key => key.length >= 2 && remaining.includes(key))
    .sort((left, right) => right.length - left.length);

  for (const key of phraseKeys) {
    remaining = remaining.split(key).join('');
  }

  return new RegExp(cjkSource).test(remaining) ? 'unmapped' : 'compound';
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!isInside(i18nRoot, fullPath)) {
        await walk(fullPath);
      }
      continue;
    }

    const extension = extname(entry.name).toLowerCase();
    if (!supportedExtensions.has(extension) || isInside(i18nRoot, fullPath)) {
      continue;
    }

    const rawContent = await readFile(fullPath, 'utf8');
    const content = extension === '.ts' ? stripTypeScriptComments(rawContent) : rawContent;
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      const matches = line.match(cjkPattern) || [];
      for (const text of matches) {
        const status = getMappingStatus(text);
        const item = {
          text,
          status,
          extension,
          file: relative(process.cwd(), fullPath),
          line: index + 1,
          context: line.trim().slice(0, 300),
        };
        occurrences.push(item);

        const key = `${status}:${text}`;
        const current = unique.get(key) || { text, status, count: 0, examples: [] };
        current.count += 1;
        if (current.examples.length < 5) {
          current.examples.push({ file: item.file, line: item.line, context: item.context });
        }
        unique.set(key, current);
      }
    });
  }
}

await collectTranslationKeys(i18nRoot);
await walk(root);
await mkdir(outputDir, { recursive: true });

const uniqueStrings = [...unique.values()]
  .sort((left, right) => left.status.localeCompare(right.status) || right.count - left.count || left.text.localeCompare(right.text));
const unmapped = occurrences.filter(item => item.status === 'unmapped');
const unmappedUI = unmapped.filter(item => item.extension !== '.ts');
const unmappedTypeScript = unmapped.filter(item => item.extension === '.ts');

const report = {
  generatedAt: new Date().toISOString(),
  scannedRoot: relative(process.cwd(), root),
  translationKeyCount: translationKeys.size,
  uniqueCount: uniqueStrings.length,
  occurrenceCount: occurrences.length,
  exactCount: occurrences.filter(item => item.status === 'exact').length,
  compoundCount: occurrences.filter(item => item.status === 'compound').length,
  unmappedCount: unmapped.length,
  unmappedUICount: unmappedUI.length,
  unmappedTypeScriptCount: unmappedTypeScript.length,
  uniqueStrings,
  occurrences,
};

await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`Từ điển hiện có ${report.translationKeyCount} khoá tiếng Việt.`);
console.log(`Đã quét ${report.occurrenceCount} lần xuất hiện Hán tự: ${report.exactCount} khớp chính xác, ${report.compoundCount} ghép cụm, ${report.unmappedCount} còn thiếu.`);
console.log(`Còn thiếu trong dữ liệu/prefab/scene: ${report.unmappedUICount}; trong mã TypeScript: ${report.unmappedTypeScriptCount}.`);
console.log(`Báo cáo: ${relative(process.cwd(), outputPath)}`);

const unmappedUnique = uniqueStrings.filter(item => item.status === 'unmapped');
for (const item of unmappedUnique.slice(0, 100)) {
  const example = item.examples[0];
  console.log(`${item.count}\t${item.text}\t${example.file}:${example.line}`);
}

if (process.env.FAIL_ON_UNMAPPED_UI === 'true' && report.unmappedUICount > 0) {
  process.exitCode = 1;
}

if (process.env.FAIL_ON_UNMAPPED_ALL === 'true' && report.unmappedCount > 0) {
  process.exitCode = 1;
}
