# ---------- build the frame + phone UI ----------
FROM oven/bun:1 AS ui
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile
COPY . ./
RUN NITRO_PRESET=node-server bunx --bun vite build

# ---------- runtime ----------
FROM node:22-bookworm-slim
ENV NODE_ENV=production NODE_NO_WARNINGS=1
WORKDIR /srv
COPY selfhost/server/package.json ./server/
RUN cd server && npm install --omit=dev --no-audit --no-fund
COPY selfhost/server/ ./server/
COPY --from=ui /app/.output ./ui
COPY selfhost/start.sh ./
RUN chmod +x start.sh && mkdir -p /data /photos/local /photos/google
EXPOSE 8080
VOLUME ["/data"]
HEALTHCHECK --interval=60s --timeout=5s CMD node -e "fetch('http://127.0.0.1:8080/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["./start.sh"]
