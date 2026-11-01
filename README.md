# Weather Station

This repository contains a full-stack IoT Weather Station monorepo designed to collect, process, store, and display environmental and air quality telemetry data. It leverages modern distributed architecture patterns including microservices, **Dapr** for state management and input bindings, **HotChocolate GraphQL**, **Angular 22**, and **.NET Aspire** for both local orchestration and native cloud deployment to Azure Container Apps (ACA).

## Documentation Index

* **[System Architecture & Data Contracts](docs/architecture.md)**: End-to-end data flow diagrams, Dapr Local vs. Azure Cloud component switching, MQTT JSON payload schema, unit conversions (°C vs. °F), and GraphQL API schema.
* **[IoT Device Firmware & Hardware Guide](device/README.md)**: ESP8266 hardware Bill of Materials (DHT22, BMP180, PMS5003), GPIO wiring pinout, `secrets.h` setup, PMS5003 non-blocking warm-up state machine, and PlatformIO instructions.
* **[Angular Frontend Guide](WeatherStation.Web/README.md)**: Frontend architecture, runtime GraphQL endpoint injection (`config.json`), Apollo Client integration, and Vitest unit testing.
* **[Azure Container Apps Prerequisite Guide](docs/azure_aca_prerequisites.md)**: Step-by-step Azure CLI instructions for provisioning Azure IoT Hub, Entra ID OIDC federated credentials, and GitHub Actions deployment secrets.

---

## Architecture Overview

The system is composed of decoupled hardware and software services orchestrated in a single monorepo:

* **IoT Weather Device Firmware ([`device/`](device/README.md))**: A PlatformIO C++ firmware project for an ESP8266 microcontroller. It reads temperature & humidity (**DHT22**), sea-level barometric pressure (**BMP180**), and atmospheric particulate matter PM1.0, PM2.5, and PM10 (**Plantower PMS5003**), publishing JSON telemetry over Wi-Fi to an MQTT broker or Azure IoT Hub.
* **Message Broker (Eclipse Mosquitto / Azure IoT Hub)**: Locally, Eclipse Mosquitto (`1883`) receives MQTT messages on `weather/telemetry`. In production on Azure, devices publish over TLS (`8883`) to Azure IoT Hub.
* **WeatherStation.TelemetryProcessor**: A .NET 10 worker/web service that receives incoming telemetry via a Dapr input binding (`POST /mqtt-telemetry`) and persists each reading into the Dapr State Store keyed by its ISO-8601 UTC timestamp.
* **WeatherStation.Api**: A .NET 10 GraphQL backend powered by **HotChocolate** (`/graphql`). It queries the Dapr state store via `DaprClient` and serves latest, historical, and paginated weather readings to the frontend.
* **WeatherStation.Web ([`WeatherStation.Web/`](WeatherStation.Web/README.md))**: An Angular 22 dashboard styled with Tailwind CSS v4 that queries the GraphQL API via Apollo Client.
* **PostgreSQL**: Serves as the backing database for the Dapr State Store (`statestore`).
* **Dapr (Distributed Application Runtime)**: Abstracts message ingestion (`bindings.mqtt` locally vs. `bindings.azure.eventhubs` in Azure) and state persistence (`state.postgresql`).
* **.NET Aspire (`WeatherStation.AppHost`)**: The single source of truth for local orchestration (`dotnet run`) and Azure Container Apps Bicep/infrastructure provisioning (`aspire deploy`).

---

## Prerequisites

This repository is pre-configured with a **Dev Container** (`.devcontainer/devcontainer.json`), which automatically installs all required SDKs and tools.

To get started with the Dev Container, you only need:
1. **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (or an equivalent container runtime like OrbStack/Colima).
2. **Visual Studio Code** with the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) (or a compatible IDE).

*When you open the repository in the Dev Container, the .NET 10 SDK, Node.js 24, Aspire CLI, Dapr CLI, and Azure CLI are installed and configured automatically.*

> **Note for manual setup:** If you choose *not* to use the Dev Container, install the .NET 10 SDK, the Aspire CLI (`aspire`), Node.js (v24+), Docker, and the Dapr CLI (`dapr init --slim`) on your host machine.

---

## Running the Application Locally

This project offers two distinct ways to run the stack locally, each serving a different purpose in the development lifecycle.

### 1. Using .NET Aspire (Inner-Loop Development)
**Best for:** Backend developers actively writing code, debugging, and inspecting distributed traces.

When you run `WeatherStation.AppHost`, Aspire natively executes the .NET 10 microservices (`WeatherStation.Api` and `WeatherStation.TelemetryProcessor`) with Dapr sidecars on your machine while spinning up PostgreSQL (with pgAdmin), the Mosquitto MQTT broker, and the containerized Angular frontend in Docker.

```bash
# Run from the AppHost directory
cd WeatherStation.AppHost
dotnet run
```
*This launches the Aspire Developer Dashboard where you can view structured logs, distributed OpenTelemetry traces, and endpoints across all resources.*

### 2. Using Docker Compose (Container Verification & Testing)
**Best for:** Verifying production `Dockerfile` builds, CI/CD parity, and running the full stack without invoking the .NET SDK.

The [`docker-compose.yml`](docker-compose.yml) file spins up the entire application stack—including the API, TelemetryProcessor, Dapr sidecars (`daprd`), Mosquitto, PostgreSQL, and Angular Nginx frontend—inside isolated Docker containers using the local Dapr manifests in [`.devdeploy/dapr/components/`](.devdeploy/dapr/components/).

```bash
# Copy the example environment variables
cp .env.example .env

# Start the containerized stack in the background
docker compose up -d
```

* **Frontend UI**: `http://localhost:4200`
* **GraphQL API & Nitro IDE**: `http://localhost:5081/graphql`

---

## Simulating Device Data

If you don't have the physical ESP8266 weather station running, you can simulate incoming sensor telemetry (including temperature, humidity, barometric pressure, and PM1.0/PM2.5/PM10 air quality readings) using the provided helper script:

```bash
# Make sure your environment (Aspire or Docker Compose) is running first!
./publish_mock_telemetry.sh
```

This script runs a temporary `eclipse-mosquitto` container to publish a JSON payload with current Unix epoch time to `localhost:1883` on the `weather/telemetry` topic. You will see the reading ingested by `WeatherStation.TelemetryProcessor` and appear in the dashboard shortly after.

---

## Deploying to Azure Container Apps (ACA)

The application deploys to Azure Container Apps using **.NET Aspire Native Deployment (`aspire deploy`)**.

### Deployment Prerequisites

Before deploying for the first time, complete the one-time setup in the **[Azure Prerequisites Guide](docs/azure_aca_prerequisites.md)**:

1. **Azure Resource Providers**: Register `Microsoft.App`, `Microsoft.ContainerRegistry`, `Microsoft.OperationalInsights`, and `Microsoft.Devices`.
2. **Azure IoT Hub**: Provision an IoT Hub instance with a consumer group named `telemetry-processor-consumer`.
3. **Microsoft Entra App Registration (for GitHub Actions OIDC)**:
   - Assign **`Contributor`** AND **`User Access Administrator`** (or `Owner`) roles on the Subscription so Aspire can grant `AcrPull` permissions to the ACA managed identity.
   - Configure a GitHub Federated Credential for the `production` environment (`repo:<owner>/<repo>:environment:production`).

### GitHub Actions Configuration

Configure the following under **Settings → Secrets and variables → Actions** (in the `production` environment):

| Name | Type | Value / Purpose |
| :--- | :--- | :--- |
| `AZURE_CLIENT_ID` | Secret | App Registration (Client) ID |
| `AZURE_TENANT_ID` | Secret | Azure Tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Secret | Azure Subscription ID |
| `AZURE_RESOURCE_GROUP` | Variable | Target Resource Group (e.g., `rg-weatherstation-prod`) |
| `AZURE_LOCATION` | Variable | Target Region (e.g., `northcentralus`) |
| `POSTGRES_PASSWORD` | Secret | Strong password for the PostgreSQL state store database |
| `IOTHUB_CONNECTION_STRING` | Secret | Connection string for the Azure IoT Hub (`iothubowner`) |

### Triggering Deployment

- **Automated CI/CD**: Push a commit to the `master` branch. The [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) workflow builds all images, pushes to ACR, provisions Azure Container Apps, and configures Dapr components (`state.postgresql` and `bindings.azure.eventhubs`) automatically.
- **Local Deployment**: Run `aspire deploy` from your local terminal:
  ```bash
  Azure__SubscriptionId="<subscription-id>" \
  Azure__ResourceGroup="rg-weatherstation-prod" \
  Azure__Location="northcentralus" \
  Parameters__postgres_password="<your-password>" \
  Parameters__iothub_connection_string="<your-iothub-connection-string>" \
  aspire deploy --apphost ./WeatherStation.AppHost/WeatherStation.AppHost.csproj --environment production
  ```

### Registering a Physical Device Identity in Azure IoT Hub

To connect a physical ESP8266 microcontroller ([`device/`](device/README.md)) or external simulator to your Azure IoT Hub, register a device identity and retrieve its connection details:

```bash
DEVICE_ID="weather-station-01"
IOTHUB_NAME="<your-iothub-name>"
RESOURCE_GROUP="rg-weatherstation-prod"

# 1. Create the device identity
az iot hub device-identity create \
  --hub-name "$IOTHUB_NAME" \
  --device-id "$DEVICE_ID" \
  --resource-group "$RESOURCE_GROUP"

# 2. Retrieve device connection string
az iot hub device-identity connection-string show \
  --hub-name "$IOTHUB_NAME" \
  --device-id "$DEVICE_ID" \
  --output tsv
```

See **[`device/README.md`](device/README.md)** for instructions on generating an MQTT SAS token and flashing the firmware.
