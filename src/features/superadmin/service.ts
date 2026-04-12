export async function requireSuperAdminUser(userId: string) {
  return { id: userId, role: 'SUPER_ADMIN' };
}
