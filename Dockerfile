# ============================
# BUILD STAGE - Frontend
# ============================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build frontend (Vite → dist/)
RUN npm run build

# ============================
# PRODUCTION STAGE
# ============================
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy server code
COPY server/ ./server/

# Copy Prisma schema
COPY server/prisma/ ./server/prisma/

# Default DB location inside the container; can be overridden at runtime.
ENV DATABASE_URL="file:/data/dev.db"

# Generate Prisma client
RUN npx prisma generate --schema=./server/prisma/schema.prisma

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/dist ./public

# Copy uploads directory structure
RUN mkdir -p public/uploads /data && chown -R nodejs:nodejs /app /data

# Copy entrypoint
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8787

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8787/api/health || exit 1

# Start server with dumb-init for proper signal handling
CMD ["dumb-init", "./docker-entrypoint.sh"]
