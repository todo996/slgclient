import { readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const sourceRoot = resolve('assets/scripts');
const i18nRoot = resolve('assets/scripts/i18n');
const dictionaryFiles = [
  resolve(i18nRoot, 'GameTerms.ts'),
  resolve(i18nRoot, 'GeneralNames.ts'),
  resolve(i18nRoot, 'I18n.ts'),
  resolve(i18nRoot, 'RuntimeTerms.ts'),
];
const cjkPattern = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;
const entryPattern = /^\s*(["'])(.*?)\1\s*:\s*(["'])(.*?)\3,?\s*$/gm;

const translations = new Map();

for (const dictionaryFile of dictionaryFiles) {
  const content = await readFile(dictionaryFile, 'utf8');
  for (const match of content.matchAll(entryPattern)) {
    const source = match[2];
    const target = match[4];
    if (cjkPattern.test(source)) {
      translations.set(source, target);
    }
  }
}

const entries = [...translations.entries()]
  .sort((left, right) => right[0].length - left[0].length || left[0].localeCompare(right[0]));

let changedFiles = 0;
let replacementCount = 0;

async function walk(directory) {
  const items = await readdir(directory, { withFileTypes: true });
  for (const item of items) {
    const fullPath = join(directory, item.name);
    if (item.isDirectory()) {
      if (fullPath !== i18nRoot) {
        await walk(fullPath);
      }
      continue;
    }

    if (extname(item.name).toLowerCase() !== '.ts') {
      continue;
    }

    const original = await readFile(fullPath, 'utf8');
    let localized = original;

    for (const [source, target] of entries) {
      if (!localized.includes(source)) {
        continue;
      }
      const parts = localized.split(source);
      replacementCount += parts.length - 1;
      localized = parts.join(target);
    }

    if (localized !== original) {
      await writeFile(fullPath, localized, 'utf8');
      changedFiles += 1;
      console.log(`Đã Việt hoá: ${fullPath}`);
    }
  }
}

await walk(sourceRoot);
console.log(`Hoàn tất: ${changedFiles} tệp thay đổi, ${replacementCount} lần thay thế.`);
