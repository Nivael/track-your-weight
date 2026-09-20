export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get('path') || '';
  if (
    !/^\d{4}-\d{2}-\d{2}_D\d+\/(front|side_left|side_right|meal_[a-z0-9_]+)\.jpe?g$/i.test(
      path,
    )
  )
    return new Response('Not found', { status: 404 });
  return Response.redirect(
    new URL(
      `/progress_photos/${path.split('/').map(encodeURIComponent).join('/')}`,
      request.url,
    ),
    307,
  );
}
