FROM node:22-bookworm-slim AS frontend-build

WORKDIR /workspace/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM maven:3.9-eclipse-temurin-25 AS backend-build

WORKDIR /workspace/backend

COPY backend/ ./
COPY --from=frontend-build /workspace/frontend/projects/patient-workflow/src/patient-workflow.components.json /workspace/frontend/projects/patient-workflow/src/patient-workflow.components.json
COPY --from=frontend-build /workspace/frontend/projects/appointments/src/appointments.components.json /workspace/frontend/projects/appointments/src/appointments.components.json
COPY --from=frontend-build /workspace/frontend/dist/frontend/browser/ application/src/main/resources/static/
RUN mvn --batch-mode --no-transfer-progress -pl application -am package

FROM eclipse-temurin:25-jre

WORKDIR /app

COPY --from=backend-build /workspace/backend/application/target/application-1.0.0.war application.war

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "application.war"]
