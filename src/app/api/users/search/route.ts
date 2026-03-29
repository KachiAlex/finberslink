import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    if (!q) return NextResponse.json({ users: [] });

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 10,
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    const mapped = users.map(u => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`.trim(),
      handle: u.email.split('@')[0],
    }));

    return NextResponse.json({ users: mapped });
  } catch (e) {
    console.error('User search failed', e);
    return NextResponse.json({ users: [] }, { status: 500 });
  }
}
