import { prisma } from "@/lib/prisma";

export interface ApplicationDraft {
  id: string;
  userId: string;
  jobOpportunityId: string;
  resumeId?: string;
  coverLetter?: string;
  answers?: Record<string, string>; // For application questions
  lastSavedAt: Date;
  jobOpportunity?: {
    id: string;
    title: string;
    company: string;
    location: string;
    slug: string;
  };
  resume?: {
    id: string;
    title: string;
    slug: string;
  };
}

export interface CreateApplicationDraftData {
  userId: string;
  jobOpportunityId: string;
  resumeId?: string;
  coverLetter?: string;
  answers?: Record<string, string>;
}

export interface UpdateApplicationDraftData {
  resumeId?: string;
  coverLetter?: string;
  answers?: Record<string, string>;
}

// Create or update application draft
export async function saveApplicationDraft(
  userId: string,
  jobOpportunityId: string,
  data: UpdateApplicationDraftData
): Promise<ApplicationDraft> {
  const draft = await prisma.applicationDraft.upsert({
    where: {
      userId_jobOpportunityId: {
        userId,
        jobOpportunityId
      }
    },
    update: {
      ...data,
      lastSavedAt: new Date()
    },
    create: {
      userId,
      jobOpportunityId,
      ...data,
      lastSavedAt: new Date()
    },
    include: {
      jobOpportunity: {
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          slug: true
        }
      },
      resume: {
        select: {
          id: true,
          title: true,
          slug: true
        }
      }
    }
  });

  return draft as ApplicationDraft;
}

// Get all application drafts for a user
export async function getUserApplicationDrafts(
  userId: string,
  limit = 10
): Promise<ApplicationDraft[]> {
  const drafts = await prisma.applicationDraft.findMany({
    where: { userId },
    include: {
      jobOpportunity: {
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          slug: true,
          isActive: true
        }
      },
      resume: {
        select: {
          id: true,
          title: true,
          slug: true
        }
      }
    },
    orderBy: { lastSavedAt: 'desc' },
    take: limit
  });

  return drafts as ApplicationDraft[];
}

// Get a specific application draft
export async function getApplicationDraft(
  userId: string,
  jobOpportunityId: string
): Promise<ApplicationDraft | null> {
  const draft = await prisma.applicationDraft.findUnique({
    where: {
      userId_jobOpportunityId: {
        userId,
        jobOpportunityId
      }
    },
    include: {
      jobOpportunity: {
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          slug: true,
          isActive: true
        }
      },
      resume: {
        select: {
          id: true,
          title: true,
          slug: true
        }
      }
    }
  });

  return draft as ApplicationDraft | null;
}

// Delete application draft
export async function deleteApplicationDraft(
  userId: string,
  jobOpportunityId: string
): Promise<void> {
  await prisma.applicationDraft.delete({
    where: {
      userId_jobOpportunityId: {
        userId,
        jobOpportunityId
      }
    }
  });
}

// Submit application from draft
export async function submitApplicationFromDraft(
  userId: string,
  jobOpportunityId: string
): Promise<{ success: boolean; applicationId?: string; error?: string }> {
  try {
    // Get the draft
    const draft = await getApplicationDraft(userId, jobOpportunityId);
    if (!draft) {
      return { success: false, error: "No draft found" };
    }

    // Check if user has already applied
    const existingApplication = await prisma.jobApplication.findFirst({
      where: {
        userId,
        jobOpportunityId
      }
    });

    if (existingApplication) {
      return { success: false, error: "Already applied to this job" };
    }

    // Create the application
    const application = await prisma.jobApplication.create({
      data: {
        userId,
        jobOpportunityId,
        resumeId: draft.resumeId,
        coverLetter: draft.coverLetter,
        status: 'SUBMITTED'
      }
    });

    // Delete the draft after successful submission
    await deleteApplicationDraft(userId, jobOpportunityId);

    return { 
      success: true, 
      applicationId: application.id 
    };
  } catch (error) {
    console.error("Error submitting application from draft:", error);
    return { success: false, error: "Failed to submit application" };
  }
}

// Get drafts that are expiring soon (for cleanup notifications)
export async function getExpiringDrafts(daysOld = 30): Promise<ApplicationDraft[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const drafts = await prisma.applicationDraft.findMany({
    where: {
      lastSavedAt: {
        lt: cutoffDate
      }
    },
    include: {
      jobOpportunity: {
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          slug: true
        }
      },
      resume: {
        select: {
          id: true,
          title: true,
          slug: true
        }
      }
    },
    orderBy: { lastSavedAt: 'asc' }
  });

  return drafts as ApplicationDraft[];
}

// Clean up old drafts (older than 90 days)
export async function cleanupOldDrafts(): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);

  const result = await prisma.applicationDraft.deleteMany({
    where: {
      lastSavedAt: {
        lt: cutoffDate
      }
    }
  });

  return result.count;
}

// Get draft completion percentage
export function getDraftCompletionPercentage(draft: ApplicationDraft): number {
  let completedFields = 0;
  const totalFields = 3; // resume, coverLetter, answers

  if (draft.resumeId) completedFields++;
  if (draft.coverLetter && draft.coverLetter.trim().length > 0) completedFields++;
  if (draft.answers && Object.keys(draft.answers).length > 0) completedFields++;

  return Math.round((completedFields / totalFields) * 100);
}

// Check if draft is ready for submission
export function isDraftReadyForSubmission(draft: ApplicationDraft): boolean {
  // At minimum, a resume is required for submission
  return !!draft.resumeId;
}

// Get drafts that are ready for submission
export async function getReadyDrafts(userId: string): Promise<ApplicationDraft[]> {
  const drafts = await getUserApplicationDrafts(userId, 50);
  return drafts.filter(isDraftReadyForSubmission);
}
