export function weekRange(date: string): [string, string] {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  const start = day.toISOString().slice(0, 10);
  day.setUTCDate(day.getUTCDate() + 6);
  return [start, day.toISOString().slice(0, 10)];
}
export function metric(rows: Record<string, string>[], key: string) {
  const values = rows
    .map((r) => r[key])
    .filter((v) => v != null && v.trim() !== '')
    .map(Number)
    .filter(Number.isFinite);
  const total = values.reduce((sum, value) => sum + value, 0);
  return {
    total,
    count: values.length,
    mean: values.length ? total / values.length : null,
  };
}
