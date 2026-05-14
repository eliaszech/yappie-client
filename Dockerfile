FROM node:22-alpine AS builder

WORKDIR /app

ARG VITE_API_URL=/api
ARG VITE_BACKEND_URL=/
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

COPY package*.json .npmrc ./
RUN npm ci

COPY . .
RUN npm run build

FROM caddy:2-alpine

COPY --from=builder /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80 443