// Company service - Firestore implementation pending
// Company model not yet migrated to Firestore

export async function getCompanies(filters?: { search?: string; page?: number; limit?: number }) {
  const { page = 1, limit = 20 } = filters || {};

  return {
    companies: [],
    pagination: {
      page,
      limit,
      total: 0,
      totalPages: 0,
    },
  };
}

export async function getCompanyBySlug(_slug: string) {
  return null;
}

export async function getCompanyJobs(_companyId: string) {
  return [];
}

export async function createCompany(_data: {
  name: string;
  description?: string;
  website?: string;
  logo?: string;
  industry?: string;
  location?: string;
  size?: string;
}) {
  return null;
}

export async function updateCompany(
  _companyId: string,
  _data: {
    name?: string;
    description?: string;
    website?: string;
    logo?: string;
    industry?: string;
    location?: string;
    size?: string;
  },
) {
  return null;
}

export async function deleteCompany(_companyId: string) {
  return null;
}

export async function getCompanyStats(_companyId: string) {
  return {
    jobCount: 0,
    applicationCount: 0,
    totalViews: 0,
  };
}
