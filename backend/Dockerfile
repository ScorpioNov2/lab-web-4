# --- ЭТАП 1: Сборка исходного кода с помощью Maven ---
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# --- ЭТАП 2: Запуск приложения с помощью JRE ---
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Создание директории для хранения файлов данных SQLite
RUN mkdir -p /app/data

COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
