FROM oven/bun:1.3
WORKDIR /app

COPY . .

RUN bun install 2>&1
RUN bun run --cwd packages/shared build
RUN bun run --cwd packages/web build
RUN bun run --cwd packages/api build

ENV NODE_ENV=production
EXPOSE 3003

CMD ["bun", "run", "--cwd", "packages/api", "dist/index.js"]
