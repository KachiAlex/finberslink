export async function requireSuperAdminSession() {
  return { userId: '', role: 'SUPER_ADMIN' };
}
