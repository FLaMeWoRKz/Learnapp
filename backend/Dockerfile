FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
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

# Copy CSV file for automatic import (wichtig: muss nach src kopiert werden)
COPY --from=builder /app/vokabeln.csv ./vokabeln.csv

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "src/server.js"]
