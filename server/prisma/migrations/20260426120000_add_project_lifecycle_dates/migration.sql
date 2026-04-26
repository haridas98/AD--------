ALTER TABLE "Project" ADD COLUMN "completedAt" TEXT;
ALTER TABLE "Project" ADD COLUMN "deletedAt" TEXT;

CREATE INDEX "Project_completedAt_idx" ON "Project"("completedAt");
CREATE INDEX "Project_deletedAt_idx" ON "Project"("deletedAt");

UPDATE "Project" SET "createdAt" = datetime('now') WHERE "createdAt" IS NULL OR "createdAt" = '';
UPDATE "Project" SET "updatedAt" = datetime('now') WHERE "updatedAt" IS NULL OR "updatedAt" = '';
