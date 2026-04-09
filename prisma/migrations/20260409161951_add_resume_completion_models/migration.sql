-- CreateTable "ResumeShareLink"
CREATE TABLE "ResumeShareLink" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "recipientEmail" TEXT,
    "senderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),

    CONSTRAINT "ResumeShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable "ResumeVersion"
CREATE TABLE "ResumeVersion" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "changeDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "ResumeVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable "ResumeExport"
CREATE TABLE "ResumeExport" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable "ResumeView"
CREATE TABLE "ResumeView" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "deviceType" TEXT,
    "browser" TEXT,
    "operatingSystem" TEXT,
    "country" TEXT,
    "city" TEXT,
    "viewerEmail" TEXT,
    "timeSpentSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeView_pkey" PRIMARY KEY ("id")
);

-- CreateTable "ResumeNotification"
CREATE TABLE "ResumeNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "viewerEmail" TEXT,
    "viewerName" TEXT,
    "aggregatedCount" INTEGER NOT NULL DEFAULT 1,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable "NotificationPreference"
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viewNotifications" BOOLEAN NOT NULL DEFAULT true,
    "downloadNotifications" BOOLEAN NOT NULL DEFAULT true,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "aggregateViews" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResumeShareLink_shareToken_key" ON "ResumeShareLink"("shareToken");

-- CreateIndex
CREATE INDEX "ResumeShareLink_resumeId_idx" ON "ResumeShareLink"("resumeId");

-- CreateIndex
CREATE INDEX "ResumeShareLink_shareToken_idx" ON "ResumeShareLink"("shareToken");

-- CreateIndex
CREATE INDEX "ResumeShareLink_expiresAt_idx" ON "ResumeShareLink"("expiresAt");

-- CreateIndex
CREATE INDEX "ResumeVersion_resumeId_idx" ON "ResumeVersion"("resumeId");

-- CreateIndex
CREATE INDEX "ResumeVersion_createdAt_idx" ON "ResumeVersion"("createdAt");

-- CreateIndex
CREATE INDEX "ResumeExport_resumeId_idx" ON "ResumeExport"("resumeId");

-- CreateIndex
CREATE INDEX "ResumeExport_createdAt_idx" ON "ResumeExport"("createdAt");

-- CreateIndex
CREATE INDEX "ResumeView_resumeId_idx" ON "ResumeView"("resumeId");

-- CreateIndex
CREATE INDEX "ResumeView_shareToken_idx" ON "ResumeView"("shareToken");

-- CreateIndex
CREATE INDEX "ResumeView_createdAt_idx" ON "ResumeView"("createdAt");

-- CreateIndex
CREATE INDEX "ResumeNotification_userId_idx" ON "ResumeNotification"("userId");

-- CreateIndex
CREATE INDEX "ResumeNotification_resumeId_idx" ON "ResumeNotification"("resumeId");

-- CreateIndex
CREATE INDEX "ResumeNotification_createdAt_idx" ON "ResumeNotification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- AddForeignKey
ALTER TABLE "ResumeShareLink" ADD CONSTRAINT "ResumeShareLink_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeShareLink" ADD CONSTRAINT "ResumeShareLink_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeVersion" ADD CONSTRAINT "ResumeVersion_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeExport" ADD CONSTRAINT "ResumeExport_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeView" ADD CONSTRAINT "ResumeView_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeNotification" ADD CONSTRAINT "ResumeNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeNotification" ADD CONSTRAINT "ResumeNotification_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
