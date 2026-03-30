# Deka Backend Dockerfile
FROM node:20-slim

WORKDIR /app

# Install OpenSSL 1.1 (required by Prisma)
RUN apt-get update && apt-get install -y --no-install-recommends libssl1.1 && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Copy source
COPY . .

# Generate Prisma client
RUN npm run prisma:generate

# Build TypeScript
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
