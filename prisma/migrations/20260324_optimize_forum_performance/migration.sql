-- AlterTable
ALTER TABLE "ForumThread" ADD COLUMN "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "ForumThread_courseId_idx" ON "ForumThread"("courseId");
CREATE INDEX "ForumThread_createdAt_idx" ON "ForumThread"("createdAt");
CREATE INDEX "ForumThread_lastActivityAt_idx" ON "ForumThread"("lastActivityAt");
CREATE INDEX "ForumThread_authorId_idx" ON "ForumThread"("authorId");

-- CreateIndex
CREATE INDEX "ForumPost_threadId_idx" ON "ForumPost"("threadId");
CREATE INDEX "ForumPost_authorId_idx" ON "ForumPost"("authorId");
CREATE INDEX "ForumPost_parentId_idx" ON "ForumPost"("parentId");
CREATE INDEX "ForumPost_createdAt_idx" ON "ForumPost"("createdAt");
