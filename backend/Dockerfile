# --- STAGE 1: Сборка исходного кода с помощью Maven и генерация кода jOOQ ---
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Сначала копируем pom.xml для использования кэша загрузки зависимостей
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Предварительное создание пустого файла DB SQLite, чтобы обеспечить среду работы для Flyway/jOOQ
RUN mkdir -p src/main/resources && touch src/main/resources/students.db

# Копируем весь исходный код
COPY src ./src

# Передача фиктивных значений для плейсхолдеров Flyway, чтобы пройти этап сборки
RUN mvn clean package -DskipTests \
    -Dflyway.placeholders.admin.username=dummy_admin \
    -Dflyway.placeholders.admin.email=dummy@example.com \
    -Dflyway.placeholders.admin.password=dummy_password

# --- STAGE 2: Запуск приложения с помощью облегченного JRE ---
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Создание директории для хранения реальной базы данных SQLite во время работы (будет подключена через Docker Volume)
RUN mkdir -p /app/data

COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
