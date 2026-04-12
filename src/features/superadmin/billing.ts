export async function getSuperAdminBillingOverview() {
  return {
    totalRevenue: 0,
    monthlyRecurringRevenue: 0,
    activeSubscriptions: 0,
    churnRate: 0,
  };
}
