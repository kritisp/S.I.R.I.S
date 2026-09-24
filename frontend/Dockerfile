# Stage 1: Build Vite React App
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

ARG VITE_API_BASE_URL=http://localhost:8080/api/v1
ARG VITE_INTEL_SERVICE_URL=http://localhost:8000/api/v1/graph
ARG VITE_RAG_API_URL=http://localhost:8001
ARG VITE_GEMINI_TOKEN_URL=http://localhost:10000/api/gemini/live-token

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_INTEL_SERVICE_URL=$VITE_INTEL_SERVICE_URL
ENV VITE_RAG_API_URL=$VITE_RAG_API_URL
ENV VITE_GEMINI_TOKEN_URL=$VITE_GEMINI_TOKEN_URL
# VITE_INTERNAL_API_KEY, VITE_GROQ_API_KEY, VITE_BHASINI_API_KEY, VITE_BHASINI_UDYAT_KEY
# intentionally not passed to the frontend build — these secrets must stay server-side.
# See firAnalysisService.ts, groqService.ts, bhasiniTranslationService.ts.

COPY . .
RUN npm run build

# Stage 2: Serve using Nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx SPA rewrite configuration
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
