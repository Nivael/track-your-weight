import { documents, getDocumentContent } from '@/lib/local-data';
export async function GET(request: Request) {
  const name = new URL(request.url).searchParams.get('name') || '';
  if (!documents.includes(name as (typeof documents)[number]))
    return new Response('Not found', { status: 404 });
  const text = getDocumentContent(name);
  if (!text) return new Response('Not found', { status: 404 });
  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'private, no-store',
    },
  });
}
