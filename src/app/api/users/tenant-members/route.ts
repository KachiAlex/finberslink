import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.cookies.get("access_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = verifyToken(token);
    
    // Get current user's tenant ID
    const user = await prisma.user.findUnique({
      where: { id: currentUser.sub },
      select: { tenantId: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.tenantId) {
      return NextResponse.json({ members: [] }); // Return empty if no tenant
    }

    // Get all active users in the same tenant (except current user)
    const tenantMembers = await prisma.user.findMany({
      where: {
        tenantId: user.tenantId,
        status: "ACTIVE",
        id: { not: currentUser.sub } // Exclude current user
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
        role: true,
        createdAt: true
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    // Format the response
    const formattedMembers = tenantMembers.map(member => ({
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      name: `${member.firstName} ${member.lastName}`.trim(),
      email: member.email,
      handle: member.email.split('@')[0],
      avatarUrl: member.avatarUrl,
      role: member.role,
      createdAt: member.createdAt
    }));

    return NextResponse.json({ 
      members: formattedMembers,
      total: formattedMembers.length
    });

  } catch (error) {
    console.error('Failed to fetch tenant members:', error);
    
    if (error instanceof Error && error.message.includes('jwt')) {
      return NextResponse.json({ error: "Invalid authentication" }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: "Failed to fetch tenant members",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
