# Estágio de compilação
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Copia arquivos do Maven e código-fonte
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
COPY src/ src/

# Garante permissão e finais de linha Linux no wrapper do Maven
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw && ./mvnw clean package -DskipTests

# Estágio de execução leve
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copia o binário gerado
COPY --from=builder /app/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]

