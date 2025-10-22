# Multi-stage build for efficient image size

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend
FROM node:20-alpine AS backend-build
WORKDIR /app/backend

# Install dependencies for canvas (required for Chart.js server-side rendering)
RUN apk add --no-cache \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    python3 \
    make \
    g++

COPY backend/package*.json ./
RUN npm install

COPY backend/ ./

# Stage 3: Production
FROM node:20-alpine
WORKDIR /app

# Install runtime dependencies for canvas
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib \
    pixman

# Copy backend
COPY --from=backend-build /app/backend ./backend

# Copy frontend build
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Expose port
EXPOSE 3003

# Start backend server
WORKDIR /app/backend
CMD ["node", "server.js"]

