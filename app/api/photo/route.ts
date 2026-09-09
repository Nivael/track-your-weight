import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root } from '@/lib/local-data';
export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get('path') || '';
  if (
    !/^\d{4}-\d{2}-\d{2}_D\d+\/(front|side_left|side_right|meal_lunch|meal_dinner_before)\.jpeg$/.test(
      path,
    )
  )
    return new Response('Not found', { status: 404 });
  try {
    return new Response(
      await readFile(resolve(root, 'progress_photos', path)),
      {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'private, no-store',
        },
      },
    );
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
