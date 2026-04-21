# Dekora Backend Dockerfile
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

# Verify build output
RUN if [ ! -f "dist/main.js" ]; then echo "ERROR: dist/main.js not created!" && ls -la dist/ && exit 1; fi

# Copy entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
