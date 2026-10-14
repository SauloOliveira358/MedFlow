# Estágio de compilação
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Copia arquivos do Maven
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Copia código-fonte e gera o .jar
COPY src/ src/
RUN ./mvnw clean package -DskipTests

# Estágio de execução leve
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copia o binário gerado
COPY --from=builder /app/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
