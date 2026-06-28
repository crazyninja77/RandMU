FROM node:22-slim AS frontend
WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

FROM node:22-slim
WORKDIR /app

# Install backend dependencies (including tsx for running TypeScript).
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci

# Copy backend source + data files.
COPY backend/ ./backend/

# Copy the pre-built frontend.
COPY --from=frontend /app/web/dist ./web/dist

# Seed the database at build time so the image ships with a ready catalogue.
RUN cd backend && node --import tsx src/seed.ts

EXPOSE 4000
ENV NODE_ENV=production
ENV PORT=4000
ENV OLLAMA_DISABLED=1

CMD ["node", "--import", "tsx", "backend/src/server.ts"]
