import content from './generated-content.json';

export const documents = [
  '减重执行计划.md',
  '七天食谱.md',
  '一周训练计划.md',
  '监测规则.md',
] as const;

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

export function getDocumentContent(name: string) {
  return (content.documents as Record<string, string>)[name] || null;
}

export async function getData() {
  return {
    records: parseCSV(content.dailyLog).sort((a, b) =>
      a.date.localeCompare(b.date),
    ),
    trainingPlan: content.trainingPlan,
    nutritionAnalysis: parseCSV(content.nutritionAnalysis).sort((a, b) =>
      a.date.localeCompare(b.date),
    ),
    watchRecords: parseCSV(content.watchLog).sort((a, b) =>
      a.date.localeCompare(b.date),
    ),
    dietAdvice: content.dietAdvice.sort((a, b) =>
      a.as_of_date.localeCompare(b.as_of_date),
    ),
    journey: content.journey.sort((a, b) => a.date.localeCompare(b.date)),
    photos: (
      content.photos as { folder: string; date: string; files: string[] }[]
    ).sort((a, b) => a.date.localeCompare(b.date)),
  };
}
