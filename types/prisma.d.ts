import type { User, Profile, Enrollment, JobApplication } from "@prisma/client";

export type AdminUserListItem = User & {
  profile?: Pick<Profile, "headline"> | null;
  _count: {
    enrollments: number;
    jobApplications: number;
    forumThreads: number;
  };
};

export type AdminUserDetail = User & {
  profile?: Pick<Profile, "headline" | "location"> | null;
  _count: {
    enrollments: number;
    jobApplications: number;
    forumThreads: number;
    forumPosts: number;
    resumes: number;
  };
  enrollments: Array<
    Pick<Enrollment, "id" | "status"> & {
      course: {
        id: string;
        title: string;
        slug: string;
      };
    }
  >;
  jobApplications: Array<
    Pick<JobApplication, "id" | "status"> & {
      opportunity: {
        title: string;
        company: string;
      };
    }
  >;
};
