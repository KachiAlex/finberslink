import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "../../../../lib/prisma";
import { verifyToken } from '../../../../lib/auth/jwt';
import { UserStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    if (!q) return NextResponse.json({ users: [] });

    // Optionally exclude current user if token present
    let currentUserId: string | null = null;
    try {
      const token = req.cookies.get("access_token")?.value;
      if (token) currentUserId = verifyToken(token).sub;
    } catch {}

    const users = await prisma.user.findMany({
      where: {
        ...(currentUserId ? { id: { not: currentUserId } } : {}),
        status: UserStatus.ACTIVE,
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 20,
      select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, role: true },
    });

    const mapped = users.map(u => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      name: `${u.firstName} ${u.lastName}`.trim(),
      handle: u.email.split('@')[0],
      avatarUrl: u.avatarUrl,
      role: u.role,
    }));

    return NextResponse.json({ users: mapped });
  } catch (e) {
    console.error('User search failed', e);
    return NextResponse.json({ users: [] }, { status: 500 });
  }
}
