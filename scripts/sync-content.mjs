import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Intentionally fixed to synthetic repository data. Never read a parent directory.
const source = resolve(project, 'demo');
const read = (path) => readFile(resolve(source, path), 'utf8');
const json = async (path) => JSON.parse(await read(path));
const names = [
  '减重执行计划.md',
  '七天食谱.md',
  '一周训练计划.md',
  '监测规则.md',
];
const content = {
  dailyLog: await read('data/daily_log.csv'),
  nutritionAnalysis: await read('data/nutrition_analysis.csv'),
  watchLog: await read('data/watch_log.csv'),
  dietAdvice: await json('data/diet_advice.json'),
  trainingPlan: await json('data/training_plan.json'),
  journey: await json('data/journey.json'),
  documents: Object.fromEntries(
    await Promise.all(names.map(async (name) => [name, await read(name)])),
  ),
  photos: [], // The distributable demo deliberately contains no personal images.
};
await writeFile(
  resolve(project, 'lib/generated-content.json'),
  JSON.stringify(content, null, 2) + '\n',
);
console.log(
  'Synthetic demo content generated. No personal data or photos read.',
);
