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

# Copy InstantDB schema file (JavaScript version in backend directory)
COPY --from=builder /app/instant.schema.js ./instant.schema.js

# Expose port
EXPOSE 3000

# Start application with tsx to support TypeScript imports
CMD ["npx", "tsx", "src/server.js"]
