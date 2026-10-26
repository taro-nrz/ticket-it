# D-35: versión web de la app, compilada estática y servida con nginx.
#   docker build -f packages/frontend/Dockerfile --build-arg EXPO_PUBLIC_API_URL=http://localhost:3000 .
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/frontend/package.json packages/frontend/
COPY packages/backend/package.json packages/backend/
RUN npm ci --workspace=frontend --ignore-scripts

COPY packages/frontend packages/frontend
# La URL del backend se fija al compilar (las variables EXPO_PUBLIC_ quedan dentro del bundle)
ARG EXPO_PUBLIC_API_URL=http://localhost:3000
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
RUN npm run build:web --workspace=frontend

FROM nginx:1.27-alpine
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/frontend/dist /usr/share/nginx/html
EXPOSE 80
