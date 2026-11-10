# --- STAGE 1: Сборка исходного кода с помощью Maven и генерация кода jOOQ ---
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Сначала копируем pom.xml для использования кэша загрузки зависимостей
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Важный шаг: Предварительное создание структуры папок и пустого файла DB SQLite, чтобы Flyway/jOOQ не завершились с ошибкой
RUN mkdir -p src/main/resources && touch src/main/resources/students.db

# Копируем весь исходный код
COPY src ./src

# Запуск сборки (Flyway и jOOQ успешно сгенерируют исходный код на основе созданного файла базы данных)
RUN mvn clean package -DskipTests

# --- STAGE 2: Запуск приложения с помощью облегченного JRE ---
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Создание директории для хранения реальной базы данных SQLite во время работы (будет подключена через Docker Volume)
RUN mkdir -p /app/data

COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
