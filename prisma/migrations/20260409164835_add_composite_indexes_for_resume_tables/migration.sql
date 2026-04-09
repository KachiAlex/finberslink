-- Add composite indexes for better query performance

-- CreateIndex for ResumeVersion(resumeId, createdAt)
CREATE INDEX "ResumeVersion_resumeId_createdAt_idx" ON "ResumeVersion"("resumeId", "createdAt");

-- CreateIndex for ResumeExport(resumeId, createdAt)
CREATE INDEX "ResumeExport_resumeId_createdAt_idx" ON "ResumeExport"("resumeId", "createdAt");

-- CreateIndex for ResumeView(resumeId, createdAt)
CREATE INDEX "ResumeView_resumeId_createdAt_idx" ON "ResumeView"("resumeId", "createdAt");

-- CreateIndex for ResumeNotification(userId, createdAt)
CREATE INDEX "ResumeNotification_userId_createdAt_idx" ON "ResumeNotification"("userId", "createdAt");
