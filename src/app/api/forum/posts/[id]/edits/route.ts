import { NextRequest, NextResponse } from 'next/server';
import { listPostEdits } from '@/features/forum/service';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const edits = await listPostEdits(params.id);
    return NextResponse.json({ edits });
  } catch (e) {
    console.error('Failed to list post edits', e);
    return NextResponse.json({ error: 'Failed to list post edits' }, { status: 500 });
  }
}
