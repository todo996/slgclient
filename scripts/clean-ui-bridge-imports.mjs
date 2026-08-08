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
  'assets/scripts/chat/ChatLogic.ts',
  'assets/scripts/chat/ChatItemLogic.ts',
  'assets/scripts/union/UnionLogic.ts',
  'assets/scripts/union/UnionLobbyLogic.ts',
  'assets/scripts/union/UnionItemLogic.ts',
];

for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  let changed = false;
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (!lines[index].includes('i18n/I18n')) continue;
    let start = index;
    while (start >= 0 && !/^\s*import\b/.test(lines[start])) start -= 1;
    if (start < 0) throw new Error(`Could not locate import start in ${file}`);
    lines.splice(start, index - start + 1);
    changed = true;
    index = start;
  }
  if (!changed) throw new Error(`Expected migrated I18n import was not found in ${file}`);
  const source = lines.join('\n');
  if (source.includes('i18n/I18n')) throw new Error(`I18n import remains in ${file}`);
  if (!source.includes('function ui(): any')) throw new Error(`UI bridge accessor missing in ${file}`);
  fs.writeFileSync(file, source);
  console.log(`Removed migrated I18n import: ${file}`);
}
