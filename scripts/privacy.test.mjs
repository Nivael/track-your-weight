import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

test('content generation uses only demo data, even with private adjacent files', async () => {
  const temp = await mkdtemp(resolve(tmpdir(), 'weight-demo-test-'));
  try {
    const project = resolve(temp, 'project');
    await mkdir(resolve(project, 'scripts'), { recursive: true });
    await mkdir(resolve(project, 'lib'));
    await mkdir(resolve(temp, 'data'));
    await mkdir(resolve(temp, 'progress_photos'));
    await writeFile(resolve(temp, 'data/daily_log.csv'), 'PRIVATE_SENTINEL');
    await writeFile(
      resolve(temp, 'progress_photos/front.jpeg'),
      'PRIVATE_SENTINEL',
    );
    await cp('demo', resolve(project, 'demo'), { recursive: true });
    await cp(
      'scripts/sync-content.mjs',
      resolve(project, 'scripts/sync-content.mjs'),
    );
    execFileSync(
      process.execPath,
      [resolve(project, 'scripts/sync-content.mjs')],
      { cwd: temp },
    );
    const generated = await readFile(
      resolve(project, 'lib/generated-content.json'),
      'utf8',
    );
    assert.equal(generated.includes('PRIVATE_SENTINEL'), false);
    const content = JSON.parse(generated);
    assert.deepEqual(content.photos, []);
    assert.match(content.dailyLog, /fictional sample/);
    assert.match(content.watchLog, /Synthetic demo/);
    assert.ok(content.trainingPlan.entries.length);
    assert.ok(content.dietAdvice[0].sources.length);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
