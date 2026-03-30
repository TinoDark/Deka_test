# Deka Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install OpenSSL 1.1 (required by Prisma)
RUN apk add --no-cache openssl=1.1.1w-r2

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
