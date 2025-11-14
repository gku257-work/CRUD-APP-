# Employee CRUD – Production-Ready (Free Tier)

This repository contains a full-stack Employee CRUD application with a Spring Boot backend and Angular frontend, designed for production deployment using entirely free services.

- Backend: Spring Boot (Java 17), REST API
- Frontend: Angular
- Database: Neon PostgreSQL (Free)
- Hosting: Google Cloud Run (backend), Vercel (frontend)
- Proxy: Cloudflare (Reverse Proxy)
- CI/CD: GitHub Actions
- Monitoring: Grafana Cloud (Prometheus + dashboards)

## CRUD Entity
Employee { id (Long), name (String), email (String) }

## Project Structure
- `backend/` – Spring Boot API
- `frontend/` – Angular app
- `.github/workflows/` – CI/CD pipelines

---

## 1) Neon PostgreSQL (Free Tier)

1. Create a Neon account and a new project: https://neon.tech/
2. Create a database (default `neondb`) and a role/user with password.
3. Obtain a connection string. Example (require SSL):
   - `postgresql://<USER>:<PASSWORD>@<HOST>/<DB>?sslmode=require`
4. For Cloud Run env vars, split into components:
   - `SPRING_DATASOURCE_URL=jdbc:postgresql://<HOST>/<DB>?sslmode=require`
   - `SPRING_DATASOURCE_USERNAME=<USER>`
   - `SPRING_DATASOURCE_PASSWORD=<PASSWORD>`

Notes:
- The app uses `spring.jpa.hibernate.ddl-auto=update` to auto-create tables.
- Ensure your Neon project allows public connections.

---

## 2) Backend – Google Cloud Run

Prerequisites:
- A GCP project with Artifact Registry and Cloud Run enabled.
- A Service Account with roles: `Artifact Registry Writer`, `Cloud Run Admin`, `Service Account User`.
- GitHub secret `GOOGLE_CREDENTIALS` with the Service Account key JSON.
- Secrets: `GCP_PROJECT_ID`, `GCP_REGION`, `ARTIFACT_REGISTRY_REPO`, `CLOUD_RUN_SERVICE`.
- DB secrets: `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`.

Local build (optional):
- `cd backend && mvn -DskipTests package`
- `docker build -t employee-crud:local .`
- `docker run -p 8080:8080 --env SPRING_DATASOURCE_URL=... --env SPRING_DATASOURCE_USERNAME=... --env SPRING_DATASOURCE_PASSWORD=... employee-crud:local`

Deploy via GitHub Actions (on push to `main`):
- Builds jar, container image, pushes to Artifact Registry, deploys Cloud Run with:
  - Memory: 256 MB
  - CPU: 1
  - Min Instances: 0
  - Env vars: `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`

After deploy, note your Cloud Run URL, e.g. `https://employee-api-abcde-uc.a.run.app`.

---

## 3) Cloudflare Reverse Proxy (Free)

1. Add your domain to Cloudflare and update nameservers as instructed.
2. Create a DNS record (e.g. `api.yourdomain.com`) as a proxied CNAME or A record pointing to Cloud Run URL (via a Cloudflare worker for proxying long URLs if desired).
3. Optionally use Cloudflare Workers to proxy to the Cloud Run URL cleanly.
4. Enable Always Use HTTPS and Free SSL in Cloudflare.
5. Caching: set page rules to cache static assets; API endpoints should bypass cache.

---

## 4) Frontend – Vercel (Free)

1. Update `frontend/src/environments/environment.prod.ts` with your backend base URL (Cloud Run or Cloudflare proxied URL).
2. Build locally: `cd frontend && npm install && npm run build`.
3. Deploy with Vercel CLI:
   - `npx vercel deploy --prod --token $VERCEL_TOKEN --cwd frontend/dist/employee-crud`.
4. Alternatively, connect GitHub repo to Vercel for auto-deploys.
5. (Optional) Add a custom domain via Vercel dashboard.

---

## 5) CI/CD – GitHub Actions

### Backend Workflow (`.github/workflows/backend.yml`)
- Triggers on push to `main` affecting `backend/**`.
- Steps:
  - Checkout, setup JDK 17, build Spring Boot JAR.
  - Auth to GCP, build Docker image, push to Artifact Registry.
  - Deploy to Cloud Run; inject Neon DB env vars.

### Frontend Workflow (`.github/workflows/frontend.yml`)
- Triggers on push to `main` affecting `frontend/**`.
- Steps:
  - Checkout, setup Node, install deps, build Angular.
  - Deploy the `dist/employee-crud` folder to Vercel using `VERCEL_TOKEN`.

Required GitHub Secrets:
- Backend: `GOOGLE_CREDENTIALS`, `GCP_PROJECT_ID`, `GCP_REGION`, `ARTIFACT_REGISTRY_REPO`, `CLOUD_RUN_SERVICE`, `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`.
- Frontend: `VERCEL_TOKEN` (and optionally `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`).

---

## 6) Monitoring – Grafana Cloud (Free)

Backend exposes Prometheus metrics at `/actuator/prometheus`.

Options:
- Use Grafana Agent (Free) on any host/platform to scrape the public endpoint and remote_write to Grafana Cloud Prometheus.
- Or add the Google Cloud Monitoring datasource in Grafana Cloud and visualize Cloud Run service metrics (CPU, Mem, Requests).

Spring Boot additions:
- `spring-boot-starter-actuator` and `micrometer-registry-prometheus` included.
- Exposed metrics: JVM, CPU, HTTP server metrics (e.g., `http_server_requests` for API errors).

Basic Dashboard:
- Create panels for:
  - CPU usage (Cloud Run metric)
  - Memory usage (Cloud Run metric)
  - Uptime (Cloud Run - request success rate, or external probe)
  - API errors: Prometheus `http_server_requests{outcome="CLIENT_ERROR"|"SERVER_ERROR"}`

Agent snippet (example):
```
metrics:
  global:
    scrape_interval: 15s
  configs:
    - name: cloudrun-backend
      scrape_configs:
        - job_name: employee-api
          static_configs:
            - targets: ['your-backend-url/actuator/prometheus']
      remote_write:
        - url: https://prometheus-prod-xx.grafana.net/api/prom/push
          basic_auth:
            username: YOUR_GRAFANA_PROM_USER
            password: YOUR_GRAFANA_PROM_API_KEY
```

---

## Environment Variables
See `.env.example` for placeholders.

Backend reads:
- `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`.

---

## Example Final URLs
- Backend: `https://api.yourdomain.com` (Cloudflare proxied to Cloud Run)
- Frontend: `https://your-vercel-app.vercel.app` or custom domain

---

## Local Development
- Backend: `cd backend && mvn spring-boot:run` (ensure Neon creds in env)
- Frontend: `cd frontend && npm install && npm start` (dev API defaults to `http://localhost:8080`)

---

## Notes
- CORS enabled for all origins in `EmployeeController` for simplicity. Adjust in production.
- Database schema is auto-managed by Hibernate. For strict prod controls, use migrations (Flyway).
- Cloudflare cache should not apply to dynamic API endpoints.