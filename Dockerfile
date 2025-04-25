FROM node:18-slim AS builder

WORKDIR /app

# Copy package files for dependency installation
COPY etl-dashboard-backup/etl-dashboard/package*.json ./

# Install dependencies
RUN npm ci

# Copy the application code
COPY etl-dashboard-backup/etl-dashboard/ ./

# Build the Next.js application (generates the standalone output)
RUN npm run build

# Production image, copy only the necessary files
FROM node:18-slim AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
ENV PORT=8080

# Copy standalone output and necessary files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Expose the application port (matches PORT env var)
EXPOSE 8080

# Start the application - the server.js is generated in the standalone output
CMD ["node", "server.js"] 