# WeatherStation.Web (Angular Frontend)

`WeatherStation.Web` is the Angular 22 dashboard application for the Weather Station monorepo. It connects to `WeatherStation.Api` via **Apollo Client (GraphQL)** and displays real-time environmental cards (temperature, humidity, barometric pressure, and PM1.0 / PM2.5 / PM10 air quality readings) along with a paginated historical readings table.

---

## Tech Stack

* **Framework**: Angular 22 (Standalone Components)
* **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`)
* **Data Fetching**: Apollo Angular (`apollo-angular` v14 / `@apollo/client` v4) over GraphQL
* **Unit Testing**: Vitest v4 (`ng test`)
* **Production Server**: Nginx (`Dockerfile` + `nginx.conf`)

---

## Runtime Configuration (`config.json` & `docker-entrypoint.sh`)

To allow the same compiled container image to run across local development, Docker Compose, .NET Aspire, and Azure Container Apps without rebuilding, the GraphQL API endpoint is loaded at runtime from [`public/assets/config.json`](public/assets/config.json) via [`ConfigService`](src/app/services/config.service.ts).

1. **Default Local Config (`public/assets/config.json`)**:
   ```json
   {
     "apiUrl": "http://localhost:5081/graphql"
   }
   ```
2. **Container Startup Injection ([`docker-entrypoint.sh`](docker-entrypoint.sh))**:
   When running inside the Nginx Docker container (under `.NET Aspire` or `Docker Compose` or `Azure Container Apps`), `docker-entrypoint.sh` inspects environment variables in priority order:
   * `API_URL`
   * `API_HTTP`
   * `services__api__https__0` (injected automatically by .NET Aspire service discovery)
   * `services__api__http__0` (injected automatically by .NET Aspire service discovery)

   It automatically appends `/graphql` if not already present and writes the resolved URL to `/usr/share/nginx/html/assets/config.json` before starting Nginx.

---

## Application Structure

```text
src/app/
├── components/
│   ├── dashboard/           # Main dashboard layout & refresh/pagination controls
│   ├── reading-card/        # Metric cards for Temp (°F), Humidity (%), Pressure (hPa), and PM levels
│   └── readings-table/      # Paginated historical telemetry table
├── models/
│   └── weather-reading.model.ts  # TypeScript interfaces matching GraphQL schema
├── services/
│   ├── config.service.ts    # Fetches /assets/config.json before app initialization
│   └── weather.service.ts   # Apollo GraphQL queries (latestReadings, paginatedReadings)
├── app.config.ts            # Application providers, HttpClient, and Apollo initialization
└── app.ts                   # Root component
```

---

## Development Workflows

### 1. Running Standalone via Angular CLI
If `WeatherStation.Api` is already running on `http://localhost:5081`, you can run the Angular dev server directly with hot-module replacement:

```bash
cd WeatherStation.Web
npm install
npm start
```
Navigate to `http://localhost:4200/`.

### 2. Running via .NET Aspire or Docker Compose
When you start the solution via `WeatherStation.AppHost` (`dotnet run`) or `docker compose up -d` from the repository root, `WeatherStation.Web` is built and served via its multi-stage [`Dockerfile`](Dockerfile) on `http://localhost:4200`.

### 3. Building for Production
```bash
npm run build
```
Build artifacts are output to `dist/weather-data/browser`.

### 4. Running Unit Tests
Unit tests are executed using **Vitest**:
```bash
npm test
```
