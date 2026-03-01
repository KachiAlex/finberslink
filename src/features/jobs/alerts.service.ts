// Job alerts service - Firestore implementation pending

type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';

export interface JobAlertData {
  userId: string;
  keywords: string[];
  location?: string;
  jobType?: JobType;
}

// TODO: Implement once JobAlert model is migrated to Firestore
export async function createJobAlert(data: JobAlertData) {
  // Placeholder - will be implemented after migration
  console.log("Creating job alert:", data);
  return { id: "temp", ...data };
}

export async function getUserJobAlerts(userId: string) {
  // Placeholder - will be implemented after migration
  console.log("Getting job alerts for user:", userId);
  return [];
}

export async function updateJobAlert(
  alertId: string,
  data: Partial<JobAlertData>
) {
  // Placeholder - will be implemented after migration
  console.log("Updating job alert:", alertId, data);
  return { id: alertId, ...data };
}

export async function deleteJobAlert(alertId: string) {
  // Placeholder - will be implemented after migration
  console.log("Deleting job alert:", alertId);
  return { id: alertId };
}

export async function findMatchingJobs(alert: {
  keywords: string[];
  location?: string;
  jobType?: JobType;
}) {
  // Placeholder - will be implemented after migration
  console.log("Finding matching jobs for alert:", alert);
  return [];
}

export async function processJobAlerts() {
  // TODO: Implement once JobAlert model is migrated
  console.log("Processing job alerts - not yet implemented");
  return [];
}
