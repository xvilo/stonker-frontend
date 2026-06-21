# syntax=docker/dockerfile:1
# Frontend image: build the SPA, serve the static bundle with nginx.
# The app calls a relative /api, so no API URL is baked in — the ingress routes
# /api to the backend and everything else here.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
