import { getData } from '@/lib/local-data';
export async function GET() {
  try {
    return Response.json(await getData(), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return Response.json(
      { error: '无法读取本地记录，请确认 data/daily_log.csv 和照片目录存在。' },
      { status: 500 },
    );
  }
}
