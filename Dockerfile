# syntax=docker/dockerfile:1

# ---------- Build ----------
FROM node:22-alpine AS build
WORKDIR /app
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .

ARG VITE_API_BASE_URL=/api/v1
ARG VITE_API_MOCK=false
ARG VITE_SITE_URL=
ARG VITE_UPLOAD_MAX_MB=10
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_API_MOCK=$VITE_API_MOCK \
    VITE_SITE_URL=$VITE_SITE_URL \
    VITE_UPLOAD_MAX_MB=$VITE_UPLOAD_MAX_MB
RUN npm run build

# ---------- Runtime ----------
FROM nginx:1.27-alpine AS runtime
# Backend (ElysiaJS) base URL that /api, /storage and /sitemap.xml are proxied to.
ENV API_UPSTREAM=http://api:3000 \
    CLIENT_MAX_BODY_SIZE=12m
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/healthz || exit 1
