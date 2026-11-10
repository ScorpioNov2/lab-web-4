# --- ЭТАП 1: Сборка Angular ---
FROM node:24.18.0-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install -g npm@11.18.0 && npm ci
COPY . .
RUN npm run build -- --configuration production

# --- ЭТАП 2: Веб-сервер Nginx и Reverse Proxy ---
FROM nginx:alpine
# Копирование конфигурации reverse proxy в nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Копирование собранного кода в корневую директорию nginx (При необходимости проверьте путь к папке dist)
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
