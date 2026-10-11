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
# Council bin dates: the community waste_collection_schedule scrapers (Python, no Home Assistant needed).
ARG WCS_REF=master
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pip git ca-certificates \
 && git clone --depth 1 --branch "$WCS_REF" https://github.com/mampfes/hacs_waste_collection_schedule /opt/wcs \
 && grep -v -i '^homeassistant' /opt/wcs/requirements.txt > /tmp/req.txt \
 && pip3 install --no-cache-dir --break-system-packages -r /tmp/req.txt \
 && rm -rf /opt/wcs/.git /opt/wcs/doc /opt/wcs/images /var/lib/apt/lists/*
ENV WCS_DIR=/opt/wcs
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
