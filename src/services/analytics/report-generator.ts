/**
 * Report Generator Service
 * 
 * Generates analytics reports in CSV and PDF formats.
 * Supports date range filtering and includes summary metrics, trends, and section engagement.
 */

import { prisma } from '@/lib/prisma';
import { Logger } from '@/lib/logger';
import { getAnalyticsDashboard } from './analytics-service';
import { getSectionEngagementMetrics } from './section-engagement-service';

const logger = new Logger('ReportGeneratorService');

export interface ReportGenerationOptions {
  resumeId: string;
  format: 'csv' | 'pdf';
  startDate?: Date;
  endDate?: Date;
  includeMetrics?: boolean;
  includeTrends?: boolean;
  includeSectionEngagement?: boolean;
}

/**
 * Generate CSV report
 */
export async function generateCSVReport(options: ReportGenerationOptions): Promise<string> {
  try {
    const { resumeId, startDate, endDate } = options;

    // Validate date range
    if (startDate && endDate && startDate > endDate) {
      throw new Error('Invalid date range: startDate must be before endDate');
    }

    // Get analytics data
    const dashboardData = await getAnalyticsDashboard(
      resumeId,
      startDate,
      endDate,
      'day'
    );

    const sectionMetrics = await getSectionEngagementMetrics(resumeId);

    // Build CSV content
    const lines: string[] = [];

    // Header
    lines.push('Resume Analytics Report');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push(`Resume ID: ${resumeId}`);
    if (startDate) lines.push(`Start Date: ${startDate.toISOString()}`);
    if (endDate) lines.push(`End Date: ${endDate.toISOString()}`);
    lines.push('');

    // Summary metrics
    lines.push('SUMMARY METRICS');
    lines.push('Metric,Value');
    lines.push(`Total Views,${dashboardData.summary.totalViews}`);
    lines.push(`Total Downloads,${dashboardData.summary.totalDownloads}`);
    lines.push(`Total Shares,${dashboardData.summary.totalShares}`);
    lines.push(`Total Exports,${dashboardData.summary.totalExports}`);
    lines.push(`Unique Viewers,${dashboardData.summary.uniqueViewers}`);
    lines.push(
      `View to Download Ratio,${dashboardData.summary.viewToDownloadRatio.toFixed(2)}`
    );
    lines.push(`Share to View Ratio,${dashboardData.summary.shareToViewRatio.toFixed(2)}`);
    lines.push('');

    // View trends
    lines.push('VIEW TRENDS');
    lines.push('Date,Views,Change %');
    dashboardData.trends.views.forEach(trend => {
      lines.push(`${trend.date},${trend.value},${trend.change.toFixed(2)}`);
    });
    lines.push('');

    // Download trends
    lines.push('DOWNLOAD TRENDS');
    lines.push('Date,Downloads,Change %');
    dashboardData.trends.downloads.forEach(trend => {
      lines.push(`${trend.date},${trend.value},${trend.change.toFixed(2)}`);
    });
    lines.push('');

    // Share trends
    lines.push('SHARE TRENDS');
    lines.push('Date,Shares,Change %');
    dashboardData.trends.shares.forEach(trend => {
      lines.push(`${trend.date},${trend.value},${trend.change.toFixed(2)}`);
    });
    lines.push('');

    // Section engagement
    lines.push('SECTION ENGAGEMENT');
    lines.push('Section,Rank,Views,Avg Time (sec),Avg Scroll Depth %,Engagement Score');
    sectionMetrics.forEach(section => {
      lines.push(
        `"${section.sectionName}",${section.rank},${section.viewCount},${section.averageTimeSpentSeconds},${section.averageScrollDepth},${section.engagementScore}`
      );
    });
    lines.push('');

    // View history
    lines.push('VIEW HISTORY (Last 50)');
    lines.push('Timestamp,Device Type,Browser,OS,Country,City,Time Spent (sec),Viewer Email');
    dashboardData.viewHistory.forEach(view => {
      lines.push(
        `${view.timestamp},"${view.deviceType || ''}","${view.browser || ''}","${view.operatingSystem || ''}","${view.country || ''}","${view.city || ''}",${view.timeSpentSeconds || 0},"${view.viewerEmail || ''}"`
      );
    });

    return lines.join('\n');
  } catch (error) {
    logger.error('Error generating CSV report', error);
    throw error;
  }
}

/**
 * Generate PDF report (returns HTML that can be converted to PDF)
 */
export async function generatePDFReportHTML(
  options: ReportGenerationOptions
): Promise<string> {
  try {
    const { resumeId, startDate, endDate } = options;

    // Validate date range
    if (startDate && endDate && startDate > endDate) {
      throw new Error('Invalid date range: startDate must be before endDate');
    }

    // Get analytics data
    const dashboardData = await getAnalyticsDashboard(
      resumeId,
      startDate,
      endDate,
      'day'
    );

    const sectionMetrics = await getSectionEngagementMetrics(resumeId);

    // Build HTML content
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Resume Analytics Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    h1 {
      color: #2c3e50;
      border-bottom: 3px solid #3498db;
      padding-bottom: 10px;
    }
    h2 {
      color: #34495e;
      margin-top: 30px;
      border-bottom: 2px solid #ecf0f1;
      padding-bottom: 5px;
    }
    .header-info {
      background-color: #ecf0f1;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    .metric-card {
      background-color: #f8f9fa;
      padding: 15px;
      border-left: 4px solid #3498db;
      border-radius: 3px;
    }
    .metric-label {
      font-size: 12px;
      color: #7f8c8d;
      text-transform: uppercase;
    }
    .metric-value {
      font-size: 24px;
      font-weight: bold;
      color: #2c3e50;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background-color: #34495e;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: bold;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #ecf0f1;
    }
    tr:nth-child(even) {
      background-color: #f8f9fa;
    }
    .page-break {
      page-break-after: always;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ecf0f1;
      font-size: 12px;
      color: #7f8c8d;
    }
  </style>
</head>
<body>
  <h1>Resume Analytics Report</h1>
  
  <div class="header-info">
    <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
    <p><strong>Resume ID:</strong> ${resumeId}</p>
    ${startDate ? `<p><strong>Start Date:</strong> ${startDate.toISOString()}</p>` : ''}
    ${endDate ? `<p><strong>End Date:</strong> ${endDate.toISOString()}</p>` : ''}
  </div>

  <h2>Summary Metrics</h2>
  <div class="metric-grid">
    <div class="metric-card">
      <div class="metric-label">Total Views</div>
      <div class="metric-value">${dashboardData.summary.totalViews}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Total Downloads</div>
      <div class="metric-value">${dashboardData.summary.totalDownloads}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Total Shares</div>
      <div class="metric-value">${dashboardData.summary.totalShares}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Unique Viewers</div>
      <div class="metric-value">${dashboardData.summary.uniqueViewers}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">View to Download Ratio</div>
      <div class="metric-value">${dashboardData.summary.viewToDownloadRatio.toFixed(2)}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Share to View Ratio</div>
      <div class="metric-value">${dashboardData.summary.shareToViewRatio.toFixed(2)}</div>
    </div>
  </div>

  <h2>Section Engagement</h2>
  <table>
    <thead>
      <tr>
        <th>Section</th>
        <th>Rank</th>
        <th>Views</th>
        <th>Avg Time (sec)</th>
        <th>Avg Scroll Depth %</th>
        <th>Engagement Score</th>
      </tr>
    </thead>
    <tbody>
      ${sectionMetrics
        .map(
          section => `
      <tr>
        <td>${section.sectionName}</td>
        <td>${section.rank}</td>
        <td>${section.viewCount}</td>
        <td>${section.averageTimeSpentSeconds}</td>
        <td>${section.averageScrollDepth}</td>
        <td>${section.engagementScore}</td>
      </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <div class="page-break"></div>

  <h2>View Trends</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Views</th>
        <th>Change %</th>
      </tr>
    </thead>
    <tbody>
      ${dashboardData.trends.views
        .map(
          trend => `
      <tr>
        <td>${trend.date}</td>
        <td>${trend.value}</td>
        <td>${trend.change.toFixed(2)}</td>
      </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <h2>Download Trends</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Downloads</th>
        <th>Change %</th>
      </tr>
    </thead>
    <tbody>
      ${dashboardData.trends.downloads
        .map(
          trend => `
      <tr>
        <td>${trend.date}</td>
        <td>${trend.value}</td>
        <td>${trend.change.toFixed(2)}</td>
      </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>This report was automatically generated by the Resume Analytics System.</p>
  </div>
</body>
</html>
    `;

    return html;
  } catch (error) {
    logger.error('Error generating PDF report HTML', error);
    throw error;
  }
}

/**
 * Validate date range for report generation
 */
export function validateReportDateRange(startDate?: Date, endDate?: Date): boolean {
  if (!startDate && !endDate) {
    return true; // No date range specified is valid
  }

  if (startDate && endDate && startDate > endDate) {
    return false;
  }

  if (startDate && startDate > new Date()) {
    return false;
  }

  if (endDate && endDate > new Date()) {
    return false;
  }

  return true;
}
