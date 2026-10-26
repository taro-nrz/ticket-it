# D-35: imagen del backend. Se construye desde la raíz del monorepo (usa el package-lock.json de los workspaces):
#   docker build -f packages/backend/Dockerfile -t ticket-it-backend .
FROM node:22-alpine
WORKDIR /app

# Primero sólo los package.json: la capa de dependencias se reutiliza mientras no cambien
COPY package.json package-lock.json ./
COPY packages/backend/package.json packages/backend/
COPY packages/frontend/package.json packages/frontend/
RUN npm ci --workspace=backend --omit=dev --ignore-scripts && npm cache clean --force

COPY packages/backend packages/backend

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0
EXPOSE 3000
USER node
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["node", "packages/backend/index.js"]
