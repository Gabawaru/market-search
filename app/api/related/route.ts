import { NextRequest, NextResponse } from 'next/server';
import { getRelatedEntities } from '@/lib/wikipedia';

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get('title');
  if (!title) return NextResponse.json({ related: [] }, { status: 400 });

  try {
    const related = await getRelatedEntities(title);
    return NextResponse.json({ related });
  } catch (err) {
    console.error('Related fetch error:', err);
    return NextResponse.json({ related: [] }, { status: 500 });
  }
}
