import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root, documents } from '@/lib/local-data';
export async function GET(request: Request) {
  const name = new URL(request.url).searchParams.get('name') || '';
  if (!documents.includes(name))
    return new Response('Not found', { status: 404 });
  try {
    return new Response(await readFile(resolve(root, name), 'utf8'), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
