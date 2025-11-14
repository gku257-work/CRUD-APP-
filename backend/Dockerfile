# Multi-stage build for efficient Cloud Run deployment

# Build stage
FROM eclipse-temurin:17-jdk AS build
WORKDIR /workspace

COPY pom.xml .
COPY src ./src

RUN ./usr/local/bin/install-maven.sh || true
RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*
RUN mvn -q -DskipTests package

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

ENV PORT=8080
EXPOSE 8080

COPY --from=build /workspace/target/employee-crud-*.jar /app/app.jar

ENTRYPOINT ["java","-jar","/app/app.jar"]