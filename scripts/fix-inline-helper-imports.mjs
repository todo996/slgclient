import fs from 'node:fs';

const files = [
  'assets/scripts/map/ui/MapUILogic.ts',
  'assets/scripts/map/ui/GeneralListLogic.ts',
  'assets/scripts/map/ui/GeneralItemLogic.ts',
  'assets/scripts/map/ui/DrawLogic.ts',
  'assets/scripts/map/ui/WarReportLogic.ts',
  'assets/scripts/map/ui/WarReportItemLogic.ts',
  'assets/scripts/map/ui/WarReportDesLogic.ts',
  'assets/scripts/map/ui/DrawRLogic.ts',
  'assets/scripts/map/ui/GeneralInfoLogic.ts',
  'assets/scripts/map/ui/SkillLogic.ts',
  'assets/scripts/map/ui/SkillItemLogic.ts',
  'assets/scripts/map/ui/SkillInfoLogic.ts',
  'assets/scripts/map/ui/TransformLogic.ts',
  'assets/scripts/map/ui/CollectLogic.ts',
  'assets/scripts/chat/ChatLogic.ts',
  'assets/scripts/chat/ChatItemLogic.ts',
  'assets/scripts/union/UnionLogic.ts',
  'assets/scripts/union/UnionLobbyLogic.ts',
  'assets/scripts/union/UnionItemLogic.ts',
];

const helperNames = new Set([
  'ANCIENT_UI',
  'addAncientScreenTitle',
  'applyAncientScreenChrome',
  'createUiText',
  'drawAncientPanel',
  'ensureUiChild',
  'ensureUiTransform',
  'findButtonByHandler',
  'getButtonHandler',
  'hideDirectUiSprites',
  'localizeNode',
  'styleAncientButton',
  'styleAncientEditBox',
  'suppressLegacyChrome',
]);

function parseNamedImport(statement) {
  const match = statement.trim().match(/^import\s*\{([\s\S]*?)\}\s*from\s*['"]([^'"]+)['"];$/);
  if (!match) return null;
  return {
    names: match[1].split(',').map((name) => name.trim()).filter(Boolean),
    modulePath: match[2],
  };
}

function rewrite(source, checkOnly) {
  const lines = source.split('\n');
  const out = [];
  let changed = false;

  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (!trimmed.startsWith('import {')) {
      out.push(lines[i]);
      continue;
    }

    const statementLines = [lines[i]];
    while (!statementLines[statementLines.length - 1].includes(';') && i + 1 < lines.length) {
      i += 1;
      statementLines.push(lines[i]);
    }
    const statement = statementLines.join('\n');
    const parsed = parseNamedImport(statement);
    if (!parsed) {
      out.push(...statementLines);
      continue;
    }

    const isSharedUiModule = parsed.modulePath.endsWith('/common/AudioManager') || parsed.modulePath.endsWith('/i18n/I18n');
    if (!isSharedUiModule) {
      out.push(...statementLines);
      continue;
    }

    const helperImports = parsed.names.filter((name) => helperNames.has(name));
    if (helperImports.length === 0) {
      out.push(...statementLines);
      continue;
    }

    if (checkOnly) {
      throw new Error(`Shared UI helper import remains: ${helperImports.join(', ')} from ${parsed.modulePath}`);
    }

    const kept = parsed.names.filter((name) => !helperNames.has(name));
    if (kept.length > 0) {
      out.push(`import { ${kept.join(', ')} } from '${parsed.modulePath}';`);
    }
    changed = true;
  }

  return { source: out.join('\n'), changed };
}

const checkOnly = process.argv.includes('--check');
let changedFiles = 0;

for (const file of files) {
  const before = fs.readFileSync(file, 'utf8');
  const result = rewrite(before, checkOnly);
  if (!checkOnly && result.changed) {
    fs.writeFileSync(file, result.source);
    changedFiles += 1;
    console.log(`Cleaned helper imports: ${file}`);
  }
  if (!result.source.includes('const ANCIENT_UI = {')) {
    throw new Error(`Controller-local UI helpers missing in ${file}`);
  }
}

console.log(checkOnly
  ? `Verified ${files.length} controllers have no shared UI helper imports.`
  : `Updated ${changedFiles} controllers; checked ${files.length}.`);
