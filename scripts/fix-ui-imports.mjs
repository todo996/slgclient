import fs from 'node:fs';

const mapFiles = [
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
];

const rootFiles = [
  'assets/scripts/chat/ChatLogic.ts',
  'assets/scripts/chat/ChatItemLogic.ts',
  'assets/scripts/union/UnionLogic.ts',
  'assets/scripts/union/UnionLobbyLogic.ts',
  'assets/scripts/union/UnionItemLogic.ts',
];

let changed = 0;

for (const file of mapFiles) {
  const before = fs.readFileSync(file, 'utf8');
  const after = before.replaceAll("from '../../i18n/I18n';", "from '../../common/AudioManager';");
  if (after === before) {
    throw new Error(`Expected map UI import not found in ${file}`);
  }
  fs.writeFileSync(file, after);
  changed += 1;
}

for (const file of rootFiles) {
  const before = fs.readFileSync(file, 'utf8');
  const after = before.replaceAll("from '../i18n/I18n';", "from '../common/AudioManager';");
  if (after === before) {
    throw new Error(`Expected root UI import not found in ${file}`);
  }
  fs.writeFileSync(file, after);
  changed += 1;
}

console.log(`Rewired ${changed} UI controllers to the stable core helper module.`);
