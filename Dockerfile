FROM oven/bun:1.3 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
COPY packages/shared/package.json packages/shared/
COPY packages/api/package.json packages/api/
COPY packages/mcp/package.json packages/mcp/
COPY packages/web/package.json packages/web/
RUN bun install --frozen-lockfile

# Copy source and config
COPY tsconfig.json postcss.config.cjs ./
COPY packages/shared ./packages/shared
COPY packages/api ./packages/api
COPY packages/web ./packages/web
COPY packages/mcp ./packages/mcp

# Build
RUN bun run --cwd packages/shared build
RUN bun run --cwd packages/web build
RUN bun run --cwd packages/api build

# Production image
FROM oven/bun:1.3 AS production
WORKDIR /app

COPY --from=base /app/packages/api/dist ./packages/api/dist
COPY --from=base /app/packages/web/dist ./packages/web/dist
COPY --from=base /app/packages/api/package.json ./packages/api/
COPY --from=base /app/packages/shared/dist ./packages/shared/dist
COPY --from=base /app/packages/shared/package.json ./packages/shared/
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./

# Serve static dashboard from API
ENV NODE_ENV=production
EXPOSE 3003

CMD ["bun", "run", "--cwd", "packages/api", "dist/index.js"]
