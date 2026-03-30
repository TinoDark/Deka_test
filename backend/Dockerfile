# Deka Backend Dockerfile
FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Install OpenSSL 1.1 (required by Prisma debian-openssl-1.1.x binaries)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy source
COPY . .

# Generate Prisma client (required before build)
RUN npm run prisma:generate

# Build TypeScript
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
