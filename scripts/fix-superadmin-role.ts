import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSuperAdminRole() {
  try {
    const email = 'superadmin@finberslink.com';
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true, firstName: true, lastName: true }
    });

    if (!user) {
      console.log(`❌ User ${email} not found in database`);
      console.log('Creating superadmin user...');
      
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const newUser = await prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          firstName: 'Super',
          lastName: 'Admin',
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
        }
      });
      
      console.log('✅ Created superadmin user:', newUser);
      return;
    }

    console.log('Found user:', user);

    if (user.role === 'SUPER_ADMIN') {
      console.log('✅ User already has SUPER_ADMIN role');
    } else {
      console.log(`⚠️  User has role: ${user.role}, updating to SUPER_ADMIN...`);
      
      const updated = await prisma.user.update({
        where: { email },
        data: { role: 'SUPER_ADMIN' }
      });
      
      console.log('✅ Updated user role to SUPER_ADMIN:', updated);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSuperAdminRole();
