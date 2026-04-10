import { prisma } from "../../lib/prisma";

export interface JobAnalytics {
  overview: {
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    totalViews: number;
    averageApplicationsPerJob: number;
    featuredJobs: number;
  };
  trends: {
    jobPostingsTrend: Array<{ date: string; count: number }>;
    applicationsTrend: Array<{ date: string; count: number }>;
    viewsTrend: Array<{ date: string; count: number }>;
  };
  topPerformers: {
    mostViewedJobs: Array<{ title: string; company: string; views: number; applications: number }>;
    mostAppliedJobs: Array<{ title: string; company: string; applications: number; views: number }>;
    topCompanies: Array<{ name: string; jobs: number; applications: number }>;
  };
  demographics: {
    jobTypeDistribution: Record<string, number>;
    remoteOptionDistribution: Record<string, number>;
    experienceLevelDistribution: Record<string, number>;
    industryDistribution: Record<string, number>;
  };
  conversion: {
    viewToApplicationRate: number;
    applicationStatusBreakdown: Record<string, number>;
    averageTimeToApply: number; // in days
  };
}

export interface UserAnalytics {
  overview: {
    totalApplications: number;
    applicationsByStatus: Record<string, number>;
    savedJobs: number;
    draftApplications: number;
    profileCompletion: number;
  };
  activity: {
    applicationTimeline: Array<{ date: string; count: number; status: string }>;
    jobViewsTimeline: Array<{ date: string; count: number }>;
    searchActivity: Array<{ date: string; searches: number; filters: string[] }>;
  };
  performance: {
    applicationSuccessRate: number;
    averageResponseTime: number; // in days
    mostAppliedJobTypes: Array<{ type: string; count: number }>;
    skillMatchScores: Array<{ skill: string; matchRate: number }>;
  };
}

// Get comprehensive job portal analytics
export async function getJobPortalAnalytics(dateRange?: { start: Date; end: Date }): Promise<JobAnalytics> {
  const defaultRange = {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date()
  };
  
  const range = dateRange || defaultRange;

  try {
    // Overview metrics
    const [totalJobs, activeJobs, totalApplications, totalViews, featuredJobs] = await Promise.all([
      prisma.jobOpportunity.count(),
      prisma.jobOpportunity.count({ where: { isActive: true } }),
      prisma.jobApplication.count(),
      prisma.jobView.count(),
      prisma.jobOpportunity.count({ where: { featured: true, isActive: true } })
    ]);

    const averageApplicationsPerJob = activeJobs > 0 ? totalApplications / activeJobs : 0;

    // Trends data
    const [jobPostingsTrend, applicationsTrend, viewsTrend] = await Promise.all([
      getJobPostingsTrend(range),
      getApplicationsTrend(range),
      getViewsTrend(range)
    ]);

    // Top performers
    const [mostViewedJobs, mostAppliedJobs, topCompanies] = await Promise.all([
      getMostViewedJobs(10),
      getMostAppliedJobs(10),
      getTopCompanies(10)
    ]);

    // Demographics
    const [jobTypeDistribution, remoteOptionDistribution, experienceLevelDistribution, industryDistribution] = await Promise.all([
      getJobTypeDistribution(),
      getRemoteOptionDistribution(),
      getExperienceLevelDistribution(),
      getIndustryDistribution()
    ]);

    // Conversion metrics
    const [viewToApplicationRate, applicationStatusBreakdown, averageTimeToApply] = await Promise.all([
      getViewToApplicationRate(),
      getApplicationStatusBreakdown(),
      getAverageTimeToApply()
    ]);

    return {
      overview: {
        totalJobs,
        activeJobs,
        totalApplications,
        totalViews,
        averageApplicationsPerJob,
        featuredJobs
      },
      trends: {
        jobPostingsTrend,
        applicationsTrend,
        viewsTrend
      },
      topPerformers: {
        mostViewedJobs,
        mostAppliedJobs,
        topCompanies
      },
      demographics: {
        jobTypeDistribution,
        remoteOptionDistribution,
        experienceLevelDistribution,
        industryDistribution
      },
      conversion: {
        viewToApplicationRate,
        applicationStatusBreakdown,
        averageTimeToApply
      }
    };
  } catch (error) {
    console.error('Error getting job portal analytics:', error);
    throw error;
  }
}

// Get user-specific analytics
export async function getUserJobAnalytics(userId: string): Promise<UserAnalytics> {
  try {
    // Overview metrics
    const [totalApplications, applicationsByStatus, savedJobs, draftApplications] = await Promise.all([
      prisma.jobApplication.count({ where: { userId } }),
      getApplicationsByStatus(userId),
      prisma.jobSave.count({ where: { userId } }),
      prisma.applicationDraft.count({ where: { userId } })
    ]);

    const profileCompletion = await calculateProfileCompletion(userId);

    // Activity data
    const [applicationTimeline, jobViewsTimeline] = await Promise.all([
      getApplicationTimeline(userId),
      getJobViewsTimeline(userId)
    ]);

    // Performance metrics
    const [applicationSuccessRate, averageResponseTime, mostAppliedJobTypes] = await Promise.all([
      getApplicationSuccessRate(userId),
      getAverageResponseTime(userId),
      getMostAppliedJobTypes(userId)
    ]);

    return {
      overview: {
        totalApplications,
        applicationsByStatus,
        savedJobs,
        draftApplications,
        profileCompletion
      },
      activity: {
        applicationTimeline,
        jobViewsTimeline,
        searchActivity: [] // Would need to track search activity
      },
      performance: {
        applicationSuccessRate,
        averageResponseTime,
        mostAppliedJobTypes,
        skillMatchScores: [] // Would need recommendation feedback data
      }
    };
  } catch (error) {
    console.error('Error getting user job analytics:', error);
    throw error;
  }
}

// Helper functions for trend data
async function getJobPostingsTrend(range: { start: Date; end: Date }) {
  const result = await prisma.$queryRaw<Array<{ date: string; count: number }>>`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as count
    FROM "JobOpportunity"
    WHERE created_at >= ${range.start} AND created_at <= ${range.end}
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `;
  return result;
}

async function getApplicationsTrend(range: { start: Date; end: Date }) {
  const result = await prisma.$queryRaw<Array<{ date: string; count: number }>>`
    SELECT 
      DATE(submitted_at) as date,
      COUNT(*) as count
    FROM "JobApplication"
    WHERE submitted_at >= ${range.start} AND submitted_at <= ${range.end}
    GROUP BY DATE(submitted_at)
    ORDER BY date ASC
  `;
  return result;
}

async function getViewsTrend(range: { start: Date; end: Date }) {
  const result = await prisma.$queryRaw<Array<{ date: string; count: number }>>`
    SELECT 
      DATE(timestamp) as date,
      COUNT(*) as count
    FROM "JobView"
    WHERE timestamp >= ${range.start} AND timestamp <= ${range.end}
    GROUP BY DATE(timestamp)
    ORDER BY date ASC
  `;
  return result;
}

// Helper functions for top performers
async function getMostViewedJobs(limit: number) {
  const result = await prisma.jobOpportunity.findMany({
    where: { isActive: true },
    select: {
      title: true,
      company: true,
      viewCount: true,
      _count: {
        select: { applications: true }
      }
    },
    orderBy: { viewCount: 'desc' },
    take: limit
  });

  return result.map(job => ({
    title: job.title,
    company: job.company,
    views: job.viewCount,
    applications: job._count.applications
  }));
}

async function getMostAppliedJobs(limit: number) {
  const result = await prisma.jobOpportunity.findMany({
    where: { isActive: true },
    select: {
      title: true,
      company: true,
      viewCount: true,
      _count: {
        select: { applications: true }
      }
    },
    orderBy: {
      applications: {
        _count: 'desc'
      }
    },
    take: limit
  });

  return result.map(job => ({
    title: job.title,
    company: job.company,
    applications: job._count.applications,
    views: job.viewCount
  }));
}

async function getTopCompanies(limit: number) {
  const result = await prisma.jobOpportunity.groupBy({
    by: ['company'],
    where: { isActive: true },
    _count: {
      id: true
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    },
    take: limit
  });

  // Get application counts for each company
  const companiesWithApps = await Promise.all(
    result.map(async (company) => {
      const applications = await prisma.jobApplication.count({
        where: {
          opportunity: {
            company: company.company,
            isActive: true
          }
        }
      });

      return {
        name: company.company,
        jobs: company._count.id,
        applications
      };
    })
  );

  return companiesWithApps;
}

// Helper functions for demographics
async function getJobTypeDistribution() {
  const result = await prisma.jobOpportunity.groupBy({
    by: ['jobType'],
    where: { isActive: true },
    _count: true
  });

  return result.reduce((acc, item) => {
    acc[item.jobType] = item._count;
    return acc;
  }, {} as Record<string, number>);
}

async function getRemoteOptionDistribution() {
  const result = await prisma.jobOpportunity.groupBy({
    by: ['remoteOption'],
    where: { isActive: true },
    _count: true
  });

  return result.reduce((acc, item) => {
    acc[item.remoteOption] = item._count;
    return acc;
  }, {} as Record<string, number>);
}

async function getExperienceLevelDistribution() {
  const result = await prisma.jobOpportunity.groupBy({
    by: ['experienceLevel'],
    where: { isActive: true, experienceLevel: { not: null } },
    _count: true
  });

  return result.reduce((acc, item) => {
    if (item.experienceLevel) {
      acc[item.experienceLevel] = item._count;
    }
    return acc;
  }, {} as Record<string, number>);
}

async function getIndustryDistribution() {
  const result = await prisma.jobOpportunity.groupBy({
    by: ['industry'],
    where: { isActive: true, industry: { not: null } },
    _count: true
  });

  return result.reduce((acc, item) => {
    if (item.industry) {
      acc[item.industry] = item._count;
    }
    return acc;
  }, {} as Record<string, number>);
}

// Helper functions for conversion metrics
async function getViewToApplicationRate() {
  const [totalViews, totalApplications] = await Promise.all([
    prisma.jobView.count(),
    prisma.jobApplication.count()
  ]);

  return totalViews > 0 ? (totalApplications / totalViews) * 100 : 0;
}

async function getApplicationStatusBreakdown() {
  const result = await prisma.jobApplication.groupBy({
    by: ['status'],
    _count: true
  });

  return result.reduce((acc, item) => {
    acc[item.status] = item._count;
    return acc;
  }, {} as Record<string, number>);
}

async function getAverageTimeToApply() {
  const result = await prisma.$queryRaw<Array<{ avg_days: number }>>`
    SELECT 
      AVG(EXTRACT(EPOCH FROM (submitted_at - created_at)) / 86400) as avg_days
    FROM "JobApplication" ja
    JOIN "JobOpportunity" jo ON ja.job_opportunity_id = jo.id
    WHERE ja.submitted_at >= jo.created_at
      AND ja.submitted_at <= jo.created_at + INTERVAL '30 days'
  `;

  return result[0]?.avg_days || 0;
}

// Helper functions for user analytics
async function getApplicationsByStatus(userId: string) {
  const result = await prisma.jobApplication.groupBy({
    by: ['status'],
    where: { userId },
    _count: true
  });

  return result.reduce((acc, item) => {
    acc[item.status] = item._count;
    return acc;
  }, {} as Record<string, number>);
}

async function calculateProfileCompletion(userId: string) {
  const [user, profile, resumeCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.profile.findUnique({ where: { userId } }),
    prisma.resume.count({ where: { userId } })
  ]);

  let completionScore = 0;
  const maxScore = 100;

  // Basic info (20 points)
  if (user?.firstName && user?.lastName) completionScore += 10;
  if (profile?.headline) completionScore += 10;

  // Profile details (30 points)
  if (profile?.bio) completionScore += 10;
  if (profile?.location) completionScore += 10;
  if (profile?.skills && profile.skills.length > 0) completionScore += 10;

  // Resume (30 points)
  if (resumeCount > 0) completionScore += 30;

  // Experience/Education (20 points)
  if (profile?.education) completionScore += 10;
  if (profile?.certifications && profile.certifications.length > 0) completionScore += 10;

  return Math.min(completionScore, maxScore);
}

async function getApplicationTimeline(userId: string) {
  const result = await prisma.jobApplication.findMany({
    where: { userId },
    select: {
      submittedAt: true,
      status: true
    },
    orderBy: { submittedAt: 'desc' },
    take: 30
  });

  return result.map(app => ({
    date: app.submittedAt.toISOString().split('T')[0],
    count: 1,
    status: app.status
  }));
}

async function getJobViewsTimeline(userId: string) {
  const result = await prisma.jobView.findMany({
    where: { userId },
    select: {
      timestamp: true
    },
    orderBy: { timestamp: 'desc' },
    take: 30
  });

  const grouped = result.reduce((acc, view) => {
    const date = view.timestamp.toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(grouped).map(([date, count]) => ({
    date,
    count
  }));
}

async function getApplicationSuccessRate(userId: string) {
  const [totalApplications, successfulApplications] = await Promise.all([
    prisma.jobApplication.count({ where: { userId } }),
    prisma.jobApplication.count({ 
      where: { 
        userId, 
        status: { in: ['OFFERED', 'INTERVIEW'] } 
      } 
    })
  ]);

  return totalApplications > 0 ? (successfulApplications / totalApplications) * 100 : 0;
}

async function getAverageResponseTime(userId: string) {
  const applications = await prisma.jobApplication.findMany({
    where: { 
      userId,
      status: { in: ['IN_REVIEW', 'INTERVIEW', 'OFFERED', 'REJECTED'] }
    },
    select: {
      submittedAt: true,
      updatedAt: true
    }
  });

  if (applications.length === 0) return 0;

  const totalResponseTime = applications.reduce((total, app) => {
    const responseTime = app.updatedAt.getTime() - app.submittedAt.getTime();
    return total + responseTime;
  }, 0);

  return totalResponseTime / applications.length / (1000 * 60 * 60 * 24); // Convert to days
}

async function getMostAppliedJobTypes(userId: string) {
  const result = await prisma.jobApplication.groupBy({
    by: ['opportunity'],
    where: { userId },
    _count: true
  });

  // Get job types for these applications
  const jobTypes = await prisma.jobOpportunity.findMany({
    where: {
      id: { in: result.map(r => r.opportunity as string) }
    },
    select: { jobType: true }
  });

  const typeCount = jobTypes.reduce((acc, job) => {
    acc[job.jobType] = (acc[job.jobType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(typeCount).map(([type, count]) => ({
    type,
    count
  }));
}

// Export analytics data for reporting
export async function exportAnalyticsData(format: 'csv' | 'json' = 'json') {
  const analytics = await getJobPortalAnalytics();
  
  if (format === 'csv') {
    // Convert to CSV format
    const csvData = convertToCSV(analytics);
    return csvData;
  }
  
  return JSON.stringify(analytics, null, 2);
}

function convertToCSV(data: JobAnalytics): string {
  const headers = [
    'Metric', 'Value', 'Category'
  ];
  
  const rows = [
    ['Total Jobs', data.overview.totalJobs.toString(), 'Overview'],
    ['Active Jobs', data.overview.activeJobs.toString(), 'Overview'],
    ['Total Applications', data.overview.totalApplications.toString(), 'Overview'],
    ['Total Views', data.overview.totalViews.toString(), 'Overview'],
    ['Average Applications per Job', data.overview.averageApplicationsPerJob.toFixed(2), 'Overview'],
    ['Featured Jobs', data.overview.featuredJobs.toString(), 'Overview'],
    ['View to Application Rate', data.conversion.viewToApplicationRate.toFixed(2) + '%', 'Conversion'],
    ['Average Time to Apply', data.conversion.averageTimeToApply.toFixed(2) + ' days', 'Conversion']
  ];

  // Add job type distribution
  Object.entries(data.demographics.jobTypeDistribution).forEach(([type, count]) => {
    rows.push([type, count.toString(), 'Job Types']);
  });

  // Add remote option distribution
  Object.entries(data.demographics.remoteOptionDistribution).forEach(([option, count]) => {
    rows.push([option, count.toString(), 'Remote Options']);
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}
