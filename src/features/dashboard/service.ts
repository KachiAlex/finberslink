import * as FirestoreService from "@/lib/firestore-service";

export async function getStudentEnrollments(userId: string) {
  // Placeholder - enrollments not yet in Firestore
  return [];
}

export async function getStudentResumes(userId: string) {
  // Placeholder - resumes not yet in Firestore
  return [];
}

export async function getStudentApplications(userId: string) {
  const { applications } = await FirestoreService.listApplicationsByUser(userId, 1, 100);

  return {
    jobs: applications,
    volunteer: [],
  };
}
