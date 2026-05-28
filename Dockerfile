# Stage 1: Install dependencies
FROM oven/bun:1 AS base
WORKDIR /app
COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/ ./packages/
RUN bun install --no-frozen-lockfile --production

# Stage 2: Build
FROM base AS build
COPY . .
RUN bun run build

# Stage 3: Run — serves both API (port 3000) and web (static)
FROM oven/bun:1 AS runner
WORKDIR /app
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/web/dist ./apps/web/dist
COPY --from=build /app/packages ./packages
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3000
ENV NODE_ENV=production
CMD ["bun", "run", "apps/api/dist/index.js"]