import { NextRequest, NextResponse } from 'next/server';
import { listPostEdits } from '@/features/forum/service';

export async function GET(req: NextRequest, context: any) {
  try {
    const params = (context && context.params) ? (await context.params) : (context?.params);
    const id = params?.id || (context?.params?.id);
    const edits = await listPostEdits(id);
    return NextResponse.json({ edits });
  } catch (e) {
    console.error('Failed to list post edits', e);
    return NextResponse.json({ error: 'Failed to list post edits' }, { status: 500 });
  }
}
