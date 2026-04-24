-- CreateTable
CREATE TABLE "ProjectAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'image',
    "storagePath" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "durationMs" INTEGER,
    "fileSize" INTEGER,
    "checksum" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "sourceType" TEXT NOT NULL DEFAULT 'upload',
    "sourcePath" TEXT,
    "altText" TEXT,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TEXT NOT NULL DEFAULT '',
    "updatedAt" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "ProjectAsset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectAssetUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "blockId" TEXT,
    "slotKey" TEXT,
    "usageType" TEXT,
    "cropX" REAL,
    "cropY" REAL,
    "cropScale" REAL,
    "focalX" REAL,
    "focalY" REAL,
    "aspectRatio" TEXT,
    "captionOverride" TEXT,
    "labelOverride" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TEXT NOT NULL DEFAULT '',
    "updatedAt" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "ProjectAssetUsage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectAssetUsage_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "ProjectAsset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProjectAsset_projectId_idx" ON "ProjectAsset"("projectId");

-- CreateIndex
CREATE INDEX "ProjectAsset_kind_idx" ON "ProjectAsset"("kind");

-- CreateIndex
CREATE INDEX "ProjectAsset_checksum_idx" ON "ProjectAsset"("checksum");

-- CreateIndex
CREATE INDEX "ProjectAsset_status_idx" ON "ProjectAsset"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectAsset_projectId_storagePath_key" ON "ProjectAsset"("projectId", "storagePath");

-- CreateIndex
CREATE INDEX "ProjectAssetUsage_projectId_idx" ON "ProjectAssetUsage"("projectId");

-- CreateIndex
CREATE INDEX "ProjectAssetUsage_assetId_idx" ON "ProjectAssetUsage"("assetId");

-- CreateIndex
CREATE INDEX "ProjectAssetUsage_blockId_idx" ON "ProjectAssetUsage"("blockId");
