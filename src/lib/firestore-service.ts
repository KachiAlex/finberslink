import type { DocumentData, DocumentSnapshot, Query, QueryDocumentSnapshot, Transaction } from "firebase-admin/firestore";
import { db } from "./firestore";

type DocData<T extends { id: string }> = Omit<T, "id">;
type QueryDoc = QueryDocumentSnapshot<DocumentData>;

function mapDoc<T extends { id: string }>(
  doc: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>,
): T {
  const data = doc.data();
  if (!data) {
    throw new Error("Document data is undefined");
  }
  return { id: doc.id, ...(data as DocData<T>) } as T;
}

function mapDocs<T extends { id: string }>(docs: QueryDoc[]): T[] {
  return docs.map((doc) => mapDoc<T>(doc));
}

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  role: 'ADMIN' | 'SUPER_ADMIN' | 'STUDENT' | 'TUTOR';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Profile {
  id: string;
  userId: string;
  headline?: string;
  location?: string;
  bio?: string;
  skills: string[];
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobOpportunity {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  location: string;
  country: string;
  jobType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  remoteOption: 'REMOTE' | 'HYBRID' | 'ONSITE';
  salaryRange?: string;
  tags: string[];
  featured: boolean;
  isActive: boolean;
  postedById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobApplication {
  id: string;
  userId: string;
  jobOpportunityId: string;
  resumeId: string;
  status: 'SUBMITTED' | 'REVIEWING' | 'INTERVIEW' | 'OFFER' | 'REJECTED';
  appliedAt: Date;
  updatedAt: Date;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  coverImage: string;
  instructorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body?: string;
  actionUrl?: string;
  readAt?: Date;
  createdAt: Date;
}

// ============================================
// USER OPERATIONS
// ============================================

export async function findUserByEmail(email: string): Promise<User | null> {
  const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
  if (snapshot.empty) return null;
  return mapDoc<User>(snapshot.docs[0]);
}

export async function findUserById(id: string): Promise<User | null> {
  const doc = await db.collection('users').doc(id).get();
  if (!doc.exists) return null;
  return mapDoc<User>(doc);
}

export async function createUser(input: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
  const now = new Date();
  const docRef = await db.collection('users').add({
    ...input,
    createdAt: now,
    updatedAt: now,
  });
  return { id: docRef.id, ...input, createdAt: now, updatedAt: now };
}

export async function updateUser(id: string, data: Partial<User>): Promise<void> {
  await db.collection('users').doc(id).update({
    ...data,
    updatedAt: new Date(),
  });
}

export async function listUsers(filters?: { role?: string; status?: string }, limit = 20): Promise<User[]> {
  let query: Query<DocumentData> = db.collection("users");

  if (filters?.role) {
    query = query.where("role", "==", filters.role);
  }
  if (filters?.status) {
    query = query.where("status", "==", filters.status);
  }

  const snapshot = await query.orderBy("createdAt", "desc").limit(limit).get();
  return mapDocs<User>(snapshot.docs as QueryDoc[]);
}

export async function countUsers(filters?: { role?: string; status?: string }): Promise<number> {
  let query: Query<DocumentData> = db.collection("users");

  if (filters?.role) {
    query = query.where("role", "==", filters.role);
  }
  if (filters?.status) {
    query = query.where("status", "==", filters.status);
  }

  const snapshot = await query.count().get();
  return snapshot.data().count;
}

// ============================================
// PROFILE OPERATIONS
// ============================================

export async function getProfile(userId: string): Promise<Profile | null> {
  const doc = await db.collection("profiles").doc(userId).get();
  if (!doc.exists) return null;
  return mapDoc<Profile>(doc);
}

export async function createProfile(userId: string, data: Omit<Profile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Profile> {
  const now = new Date();
  await db.collection('profiles').doc(userId).set({
    userId,
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return { id: userId, userId, ...data, createdAt: now, updatedAt: now };
}

export async function updateProfile(userId: string, data: Partial<Profile>): Promise<void> {
  await db.collection('profiles').doc(userId).update({
    ...data,
    updatedAt: new Date(),
  });
}

// ============================================
// JOB OPPORTUNITY OPERATIONS
// ============================================

export async function getJobById(id: string): Promise<JobOpportunity | null> {
  const doc = await db.collection("jobs").doc(id).get();
  if (!doc.exists) return null;
  return mapDoc<JobOpportunity>(doc);
}

export async function createJob(data: Omit<JobOpportunity, 'id' | 'createdAt' | 'updatedAt'>): Promise<JobOpportunity> {
  const now = new Date();
  const docRef = await db.collection('jobs').add({
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return { id: docRef.id, ...data, createdAt: now, updatedAt: now };
}

export async function updateJob(id: string, data: Partial<JobOpportunity>): Promise<void> {
  await db.collection('jobs').doc(id).update({
    ...data,
    updatedAt: new Date(),
  });
}

export async function deleteJob(id: string): Promise<void> {
  await db.collection('jobs').doc(id).delete();
}

export async function listJobs(filters?: {
  isActive?: boolean;
  jobType?: string;
  remoteOption?: string;
  featured?: boolean;
}, page = 1, limit = 20): Promise<{ jobs: JobOpportunity[]; total: number }> {
  let query: Query<DocumentData> = db.collection("jobs");

  if (filters?.isActive !== undefined) {
    query = query.where("isActive", "==", filters.isActive);
  }
  if (filters?.jobType) {
    query = query.where("jobType", "==", filters.jobType);
  }
  if (filters?.remoteOption) {
    query = query.where("remoteOption", "==", filters.remoteOption);
  }
  if (filters?.featured !== undefined) {
    query = query.where("featured", "==", filters.featured);
  }

  const countSnapshot = await query.count().get();
  const total = countSnapshot.data().count;

  const skip = (page - 1) * limit;
  const snapshot = await query.orderBy("createdAt", "desc").offset(skip).limit(limit).get();
  const jobs = snapshot.docs.map((doc: QueryDoc) => mapDoc<JobOpportunity>(doc));

  return { jobs, total };
}

export async function searchJobs(searchTerm: string, page = 1, limit = 20): Promise<{ jobs: JobOpportunity[]; total: number }> {
  // Firestore doesn't support full-text search natively
  // This is a simple implementation - for production, use Algolia or Meilisearch
  const snapshot = await db.collection("jobs")
    .where("isActive", "==", true)
    .orderBy("createdAt", "desc")
    .get();

  const allJobs = snapshot.docs.map((doc: QueryDoc) => mapDoc<JobOpportunity>(doc));
  
  const filtered = allJobs.filter((job: JobOpportunity) =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const skip = (page - 1) * limit;
  const jobs = filtered.slice(skip, skip + limit);

  return { jobs, total: filtered.length };
}

// ============================================
// JOB APPLICATION OPERATIONS
// ============================================

export async function getApplicationById(id: string): Promise<JobApplication | null> {
  const doc = await db.collection("jobApplications").doc(id).get();
  if (!doc.exists) return null;
  return mapDoc<JobApplication>(doc);
}

export async function createApplication(data: Omit<JobApplication, 'id' | 'appliedAt' | 'updatedAt'>): Promise<JobApplication> {
  const now = new Date();
  const docRef = await db.collection('jobApplications').add({
    ...data,
    appliedAt: now,
    updatedAt: now,
  });
  return { id: docRef.id, ...data, appliedAt: now, updatedAt: now };
}

export async function updateApplication(id: string, data: Partial<JobApplication>): Promise<void> {
  await db.collection('jobApplications').doc(id).update({
    ...data,
    updatedAt: new Date(),
  });
}

export async function listApplicationsByUser(userId: string, page = 1, limit = 20): Promise<{ applications: JobApplication[]; total: number }> {
  const countSnapshot = await db.collection("jobApplications")
    .where("userId", "==", userId)
    .count()
    .get();
  const total = countSnapshot.data().count;

  const skip = (page - 1) * limit;
  const snapshot = await db.collection("jobApplications")
    .where("userId", "==", userId)
    .orderBy("appliedAt", "desc")
    .offset(skip)
    .limit(limit)
    .get();

  const applications = snapshot.docs.map((doc: QueryDoc) => mapDoc<JobApplication>(doc));
  return { applications, total };
}

export async function listApplicationsByJob(jobId: string, page = 1, limit = 20): Promise<{ applications: JobApplication[]; total: number }> {
  let query: Query<DocumentData> = db.collection("jobApplications");

  if (jobId) {
    query = query.where("jobOpportunityId", "==", jobId);
  }

  const countSnapshot = await query.count().get();
  const total = countSnapshot.data().count;

  const skip = (page - 1) * limit;
  const snapshot = await query.orderBy("appliedAt", "desc").offset(skip).limit(limit).get();
  const applications = snapshot.docs.map((doc: QueryDoc) => mapDoc<JobApplication>(doc));
  return { applications, total };
}

export async function countApplicationsByStatus(jobId: string): Promise<Record<string, number>> {
  const snapshot = await db.collection("jobApplications")
    .where("jobOpportunityId", "==", jobId)
    .get();

  const counts: Record<string, number> = {};
  snapshot.docs.forEach((doc: QueryDoc) => {
    const application = mapDoc<JobApplication>(doc);
    const status = application.status;
    counts[status] = (counts[status] || 0) + 1;
  });

  return counts;
}

// ============================================
// COURSE OPERATIONS
// ============================================

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const snapshot = await db.collection("courses").where("slug", "==", slug).limit(1).get();
  if (snapshot.empty) return null;
  return mapDoc<Course>(snapshot.docs[0]);
}

export async function getCourseById(id: string): Promise<Course | null> {
  const doc = await db.collection("courses").doc(id).get();
  if (!doc.exists) return null;
  return mapDoc<Course>(doc);
}

export async function createCourse(data: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<Course> {
  const now = new Date();
  const docRef = await db.collection('courses').add({
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return { id: docRef.id, ...data, createdAt: now, updatedAt: now };
}

export async function updateCourse(id: string, data: Partial<Course>): Promise<void> {
  await db.collection('courses').doc(id).update({
    ...data,
    updatedAt: new Date(),
  });
}

export async function listCourses(page = 1, limit = 20): Promise<{ courses: Course[]; total: number }> {
  const countSnapshot = await db.collection('courses').count().get();
  const total = countSnapshot.data().count;

  const skip = (page - 1) * limit;
  const snapshot = await db.collection("courses")
    .orderBy("createdAt", "desc")
    .offset(skip)
    .limit(limit)
    .get();

  const courses = snapshot.docs.map((doc: QueryDoc) => mapDoc<Course>(doc));
  return { courses, total };
}

// ============================================
// NOTIFICATION OPERATIONS
// ============================================

export async function createNotification(data: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
  const now = new Date();
  const docRef = await db.collection('notifications').add({
    ...data,
    createdAt: now,
  });
  return { id: docRef.id, ...data, createdAt: now };
}

export async function listUserNotifications(userId: string, limit = 20): Promise<Notification[]> {
  const snapshot = await db.collection('notifications')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return mapDocs<Notification>(snapshot.docs as QueryDoc[]);
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await db.collection('notifications').doc(id).update({
    readAt: new Date(),
  });
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const snapshot = await db.collection('notifications')
    .where('userId', '==', userId)
    .where('readAt', '==', null)
    .get();

  const batch = db.batch();
  snapshot.docs.forEach((doc: QueryDoc) => {
    batch.update(doc.ref, { readAt: new Date() });
  });
  await batch.commit();
}

export async function getUnreadCount(userId: string): Promise<number> {
  const snapshot = await db.collection('notifications')
    .where('userId', '==', userId)
    .where('readAt', '==', null)
    .count()
    .get();

  return snapshot.data().count;
}

// ============================================
// BATCH OPERATIONS
// ============================================

type BatchOperation = {
  type: "set" | "update" | "delete";
  collection: string;
  docId: string;
  data?: DocumentData;
};

export async function batchWrite(operations: BatchOperation[]): Promise<void> {
  const batch = db.batch();

  operations.forEach(op => {
    const docRef = db.collection(op.collection).doc(op.docId);
    if (op.type === 'set') {
      batch.set(docRef, op.data);
    } else if (op.type === 'update') {
      batch.update(docRef, op.data);
    } else if (op.type === 'delete') {
      batch.delete(docRef);
    }
  });

  await batch.commit();
}

// ============================================
// TRANSACTION OPERATIONS
// ============================================

export async function runTransaction<T>(callback: (_transaction: Transaction) => Promise<T>): Promise<T> {
  return db.runTransaction((transaction: Transaction) => callback(transaction));
}
