const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const adapter = process.env.DATABASE_URL
  ? new (require('@prisma/adapter-pg').PrismaPg)({ connectionString: process.env.DATABASE_URL })
  : undefined;

const prisma = new PrismaClient({
  log: ['error', 'warn'],
  ...(adapter ? { adapter } : {}),
});

async function checkRoles() {
  try {
    const users = await prisma.user.findMany({
      select: { role: true },
      distinct: ['role'],
    });
    
    console.log('Available roles:');
    users.forEach(user => console.log('-', user.role));
    
    // Also check for instructor
    const instructor = await prisma.user.findFirst({
      where: { email: { contains: 'cynthia', mode: 'insensitive' } },
      select: { id: true, email: true, role: true, firstName: true, lastName: true },
    });
    
    console.log('\nCynthia user:');
    if (instructor) {
      console.log('- ID:', instructor.id);
      console.log('- Email:', instructor.email);
      console.log('- Role:', instructor.role);
      console.log('- Name:', `${instructor.firstName} ${instructor.lastName}`);
    } else {
      console.log('- Not found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRoles();
