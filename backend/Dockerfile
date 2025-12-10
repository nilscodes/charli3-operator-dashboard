# Backend Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create directory for config file
RUN mkdir -p /app/config

# Environment variable for config path
ENV CONFIG_PATH=/app/config/config.yaml
ENV NODE_ENV=production

EXPOSE 4000

CMD ["node", "dist/index.js"]

