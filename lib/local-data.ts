import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
export const root = resolve(process.cwd(), 'demo');
export const documents = [
  '减重执行计划.md',
  '七天食谱.md',
  '一周训练计划.md',
  '监测规则.md',
];
export function parseCSV(text: string) {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = '',
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if (c === '\n' && !quoted) {
      row.push(cell.replace(/\r$/, ''));
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const headers = rows.shift() || [];
  return rows.map((r) =>
    Object.fromEntries(headers.map((h, i) => [h, r[i] || ''])),
  );
}
export async function getData() {
  const records = parseCSV(
    await readFile(resolve(root, 'data/daily_log.csv'), 'utf8'),
  ).sort((a, b) => a.date.localeCompare(b.date));
  let journey: { date: string; title: string; summary: string }[] = [];
  try {
    journey = JSON.parse(
      await readFile(resolve(root, 'data/journey.json'), 'utf8'),
    );
  } catch {
    journey = [];
  }
  const folders = (
    await readdir(resolve(root, 'progress_photos'), { withFileTypes: true })
  ).filter((d) => d.isDirectory() && /^\d{4}-\d{2}-\d{2}_D\d+$/.test(d.name));
  const photos = await Promise.all(
    folders.map(async (d) => ({
      folder: d.name,
      date: d.name.slice(0, 10),
      files: (await readdir(resolve(root, 'progress_photos', d.name))).filter(
        (f) =>
          /^(front|side_left|side_right|meal_lunch|meal_dinner_before)\.jpeg$/.test(
            f,
          ),
      ),
    })),
  );
  return {
    records,
    journey: journey.sort((a, b) => a.date.localeCompare(b.date)),
    photos: photos.sort((a, b) => a.date.localeCompare(b.date)),
  };
}
