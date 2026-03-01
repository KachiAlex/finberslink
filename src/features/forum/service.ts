// Forum service - Firestore implementation pending
// For now, returning placeholder data

export async function createForumThread(input: {
  title: string;
  courseId: string;
  authorId: string;
}) {
  return {
    id: 'thread_' + Date.now(),
    title: input.title,
    courseId: input.courseId,
    authorId: input.authorId,
    author: {
      id: input.authorId,
      firstName: 'User',
      lastName: 'Name',
    },
    course: {
      id: input.courseId,
      title: 'Course',
      slug: 'course',
    },
    posts: [],
    createdAt: new Date(),
  };
}

export async function listForumThreads(courseId?: string, limit = 20) {
  return [];
}

export async function getForumThreadById(id: string) {
  return null;
}

export async function createForumPost(input: {
  content: string;
  threadId: string;
  authorId: string;
  lessonId?: string;
  parentId?: string;
}) {
  return {
    id: 'post_' + Date.now(),
    content: input.content,
    threadId: input.threadId,
    authorId: input.authorId,
    author: {
      id: input.authorId,
      firstName: 'User',
      lastName: 'Name',
    },
    createdAt: new Date(),
  };
}
