import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOTS = ['assets/scripts', 'assets'];
const EXTENSIONS = new Set(['.ts', '.js', '.json', '.prefab', '.scene']);
const CJK = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g;
const DEBUG_PATTERNS = [
  /console\.(log|debug)\s*\(/g,
  /showFPS\s*[:=]\s*true/g,
  /setDisplayStats\s*\(\s*true\s*\)/g,
  /mock(Data|Response|Result)?/gi,
  /placeholder/gi,
];

async function walk(directory, output = []) {
  let entries;
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch {
    return output;
  }

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'build' || entry.name === 'temp' || entry.name === 'library') {
      continue;
    }
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, output);
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      output.push(fullPath);
    }
  }
  return output;
}

const files = [...new Set((await Promise.all(ROOTS.map(root => walk(root)))).flat())];
const findings = {
  filesScanned: files.length,
  cjkFiles: [],
  debugFiles: [],
};

for (const file of files) {
  const content = await fs.readFile(file, 'utf8');
  const cjk = content.match(CJK);
  if (cjk?.length) {
    findings.cjkFiles.push({ file, count: cjk.length });
  }

  const debugCount = DEBUG_PATTERNS.reduce((total, pattern) => {
    pattern.lastIndex = 0;
    return total + (content.match(pattern)?.length ?? 0);
  }, 0);
  if (debugCount) {
    findings.debugFiles.push({ file, count: debugCount });
  }
}

findings.cjkFiles.sort((a, b) => b.count - a.count);
findings.debugFiles.sort((a, b) => b.count - a.count);

await fs.mkdir('artifacts', { recursive: true });
await fs.writeFile('artifacts/ui-audit.json', `${JSON.stringify(findings, null, 2)}\n`, 'utf8');

console.log(`UI audit scanned ${findings.filesScanned} files.`);
console.log(`Files containing CJK text: ${findings.cjkFiles.length}.`);
console.log(`Files containing debug/mock/placeholder markers: ${findings.debugFiles.length}.`);
console.log('Detailed report: artifacts/ui-audit.json');
