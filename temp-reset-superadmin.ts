import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'superadmin@finberslink.com' },
    create: {
      email: 'superadmin@finberslink.com',
      firstName: 'Super',
      lastName: 'Admin',
      passwordHash: hash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
    update: {
      passwordHash: hash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log('superadmin upserted and password reset to admin123');
}

main()
  .catch(console.error)
  .finally(async () => { await prisma.$disconnect(); });
