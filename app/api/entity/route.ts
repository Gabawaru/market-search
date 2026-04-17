import { NextRequest, NextResponse } from 'next/server';
import { getEntitySummary } from '@/lib/wikipedia';

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get('title');
  if (!title) return NextResponse.json({ entity: null }, { status: 400 });

  try {
    const entity = await getEntitySummary(title);
    return NextResponse.json({ entity });
  } catch (err) {
    console.error('Entity fetch error:', err);
    return NextResponse.json({ entity: null }, { status: 500 });
  }
}
