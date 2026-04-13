/**
 * Analytics Service Exports
 */

// Main analytics service
export {
  recordAnalyticsEvent,
  getAnalyticsSummary,
  getTrends,
  getSectionEngagement,
  getViewHistory,
  getRecentViewers,
  getAnalyticsDashboard,
  updateSectionEngagement,
  deleteAnalyticsData,
} from './analytics-service';

export type {
  AnalyticsEvent,
  AnalyticsSummary,
  TrendPoint,
  SectionEngagement,
  ViewRecord,
  ViewerInfo,
  AnalyticsDashboardData,
} from './analytics-service';

// Section engagement service
export {
  trackSectionEngagement,
  getSectionEngagementMetrics,
  getRankedSections,
  getTopEngagedSections,
  getSectionEngagementPercentages,
  resetSectionEngagement,
  compareSectionEngagement,
} from './section-engagement-service';

export type {
  SectionEngagementData,
  SectionEngagementMetrics,
} from './section-engagement-service';

// Report generator service
export {
  generateCSVReport,
  generatePDFReportHTML,
  validateReportDateRange,
} from './report-generator';

export type { ReportGenerationOptions } from './report-generator';

// Archival service
export {
  archiveOldAnalyticsData,
  deleteArchivedResumeAnalytics,
  getArchivalStatus,
  queryAnalyticsWithArchival,
  verifyArchivalIntegrity,
  scheduleMonthlyArchival,
} from './archival-service';

export type { ArchivalStats } from './archival-service';
