FROM node:22-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json tsconfig.json ./

# Install dependencies without running prepare script
RUN npm install --ignore-scripts

# Now copy the source code
COPY index.ts ./

# Run build manually
RUN npm run build

FROM node:22-alpine AS release
WORKDIR /app

# Copy built files and package files
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package.json

# Install production dependencies only
ENV NODE_ENV=production
RUN npm install --omit=dev --ignore-scripts

ENTRYPOINT ["node", "dist/index.js"]