# =============================
#    Next.js Multi-stage Dockerfile
# =============================

# Stage 1: Dependencies
FROM node:22-alpine AS deps
# RUN apk add --no-cache libc6-compat

# Enable pnpm for faster package management
RUN corepack enable pnpm

WORKDIR /app

# Copy package files (using pnpm)
COPY package.json pnpm-lock.yaml* ./

# Install production dependencies
RUN pnpm install

# =============================
# Stage 2: Builder
# =============================
FROM node:22-alpine AS builder
WORKDIR /app

# Enable pnpm
RUN corepack enable pnpm

# Copy dependencies from deps stage
# COPY package.json pnpm-lock.yaml* ./
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Install all dependencies (including devDependencies for build)
RUN pnpm install

# Set build environment variables
# ENV NODE_ENV=production
# ENV NEXT_TELEMETRY_DISABLED=1
# ENV NEXT_PUBLIC_BACKEND_API_URL=http://localhost:3000/api/mock
# ENV NEXT_PUBLIC_BASE_URL=http://localhost:3000
# ENV API_URL=https://acm.askme.co.th/api
# Set Dify environment variables for build time
# ENV DIFY_API_KEY=app-da8f2LKv8lTtacCQt8xDwq7y
# ENV DIFY_APP_ID=app-1b3e7b1f-e77b-4a0a-85ec-e45057dbebb1
# ENV DIFY_BASE_URL=https://dify.askme.co.th/v1

# Build Next.js application
RUN pnpm build

# =============================
# Stage 3: Production Runner  
# =============================
# FROM node:22-alpine AS runner
# WORKDIR /app

# ENV NODE_ENV=production
# ENV NEXT_TELEMETRY_DISABLED=1

# Install runtime dependencies
RUN apk update && apk add --no-cache \
  libc6-compat \
  curl \
  && rm -rf /var/cache/apk/*

# Enable pnpm for runtime
# RUN corepack enable pnpm

# Create nextjs user for security
# RUN addgroup --system --gid 1001 nodejs
# RUN adduser --system --uid 1001 nextjs

# Copy package files and install production dependencies
# COPY package.json pnpm-lock.yaml* ./
# RUN pnpm install --frozen-lockfile --prod && pnpm store prune

# Copy built application from builder stage (without standalone)
# COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
# COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# COPY --from=builder /app/next.config.ts ./

# Switch to nextjs user for security
# USER nextjs
# Expose port 3000
EXPOSE 3000

# Set environment variables
# ENV PORT=3000
# ENV HOSTNAME="0.0.0.0"

# Health check
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#   CMD curl -f http://localhost:9999/ || exit 1

# Start Next.js with pnpm start (not standalone)
CMD ["pnpm", "start"]

