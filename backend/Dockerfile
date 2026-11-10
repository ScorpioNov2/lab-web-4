# --- STAGE 1: Упаковка приложения с помощью Maven ---
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Сначала копируем pom.xml для использования кэша зависимостей
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Копируем весь исходный код в контейнер
COPY src ./src

# Запуск упаковки в .jar и полное отключение плагинов, выполняемых во время сборки
RUN mvn clean package -DskipTests \
    -Dflyway.skip=true \
    -Djooq.codegen.skip=true

# --- STAGE 2: Запуск приложения Spring Boot ---
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Создание директории для хранения реальной базы данных SQLite во время работы (volume настроен в docker-compose)
RUN mkdir -p /app/data

COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
