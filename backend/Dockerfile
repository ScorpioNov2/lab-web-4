# --- STAGE 1: Упаковка приложения с помощью Maven ---
FROM maven:3.9.9-eclipse-temurin-21-alpines AS build
WORKDIR /app

# Сначала копируем pom.xml для использования кэша
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Копируем весь исходный код в контейнер
COPY src ./src

# Вызов конкретных плагинов компиляции и упаковки для ПРОПУСКА фазы generate-sources
RUN mvn resources:resources compiler:compile jar:jar

# --- STAGE 2: Запуск приложения Spring Boot ---
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Создание директории для хранения реальной базы данных SQLite во время работы
RUN mkdir -p /app/data

# Так как команда jar вызывается напрямую, выходной jar-файл будет находиться в папке target/
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]