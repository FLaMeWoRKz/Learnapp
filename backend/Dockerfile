FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code from backend directory
COPY . .

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/src ./src

# Copy CSV file for automatic import
COPY --from=builder /app/vokabeln.csv ./vokabeln.csv

# Copy InstantDB schema file (it's in the root, one level up from backend/)
# We need to copy it from the build context
COPY ../instant.schema.ts ./instant.schema.ts

# Expose port
EXPOSE 3000

# Start application with tsx to support TypeScript imports
CMD ["npx", "tsx", "src/server.js"]
