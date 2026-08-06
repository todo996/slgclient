import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import ts from 'typescript';

const sourceRoot = resolve('assets/scripts');
const diagnostics = [];
let fileCount = 0;

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath);
      continue;
    }

    if (extname(entry.name).toLowerCase() !== '.ts') {
      continue;
    }

    fileCount += 1;
    const source = await readFile(fullPath, 'utf8');
    const result = ts.transpileModule(source, {
      fileName: fullPath,
      reportDiagnostics: true,
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
        experimentalDecorators: true,
        useDefineForClassFields: false,
      },
    });

    for (const diagnostic of result.diagnostics || []) {
      const position = diagnostic.file && typeof diagnostic.start === 'number'
        ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
        : null;
      diagnostics.push({
        file: relative(process.cwd(), fullPath),
        line: position ? position.line + 1 : null,
        column: position ? position.character + 1 : null,
        code: diagnostic.code,
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
      });
    }
  }
}

await walk(sourceRoot);

if (diagnostics.length > 0) {
  console.error(`Phát hiện ${diagnostics.length} lỗi cú pháp trong ${fileCount} tệp TypeScript:`);
  for (const diagnostic of diagnostics) {
    const location = diagnostic.line
      ? `${diagnostic.file}:${diagnostic.line}:${diagnostic.column}`
      : diagnostic.file;
    console.error(`${location} TS${diagnostic.code}: ${diagnostic.message}`);
  }
  process.exit(1);
}

console.log(`Cú pháp hợp lệ: ${fileCount} tệp TypeScript.`);
