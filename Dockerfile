# Stage 1: Install dependencies
FROM oven/bun:1 AS base
WORKDIR /app
COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/
RUN bun install --no-frozen-lockfile --production

# Stage 2: Build
FROM base AS build
COPY . .
RUN bun run build

# Stage 3: Run
FROM oven/bun:1 AS runner
WORKDIR /app
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages ./packages
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3000
CMD ["bun", "run", "apps/api/dist/index.js"]