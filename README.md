# Weather Station

This repository contains a full-stack Weather Station application designed to process and display IoT telemetry data. It leverages modern architecture patterns including microservices, Dapr for distributed application capabilities, and .NET Aspire for local orchestration.

## Architecture Overview

The system is composed of several decoupled services:

* **WeatherStation.Api**: A .NET backend API that serves data to the frontend. It runs with a Dapr sidecar for service-to-service communication and state management.
* **WeatherStation.TelemetryProcessor**: A .NET worker service responsible for ingesting, processing, and storing weather telemetry data. It also utilizes a Dapr sidecar.
* **WeatherStation.Web**: The frontend user interface built with Angular, serving as the main dashboard for weather data.
* **IoT Weather Device Firmware (`/device`)**: A PlatformIO project written in C++ for an ESP8266 microcontroller. It uses attached physical sensors (DHT for temperature/humidity, BMP180 for pressure) and publishes the collected telemetry over WiFi to the MQTT broker.
* **MQTT Broker (Eclipse Mosquitto)**: Acts as the message broker for incoming telemetry from the physical device.
* **PostgreSQL**: Serves as the primary database for the application and is also configured as the Dapr State Store.
* **Dapr (Distributed Application Runtime)**: Handles distributed concerns like state management, pub/sub messaging, and secure service-to-service invocation.
* **.NET Aspire (AppHost)**: The local development orchestrator that seamlessly ties all these services together.

## Prerequisites

This repository is fully configured with a **Dev Container**, which automates the setup of the entire development environment.

To get started, you only need:
1. **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (or an equivalent container runtime like OrbStack/Colima).
2. **Visual Studio Code** with the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) (or a compatible IDE).

*When you open the repository in the Dev Container, the .NET 10 SDK, Node.js 24, Dapr CLI, and .NET Aspire workload are all installed and configured for you automatically!*

> **Note for manual setup:** If you choose *not* to use the Dev Container, you will need to manually install the .NET 10 SDK, the Aspire workload (`dotnet workload install aspire`), Node.js (v24+), and the Dapr CLI on your host machine.

---

## Running the Application Locally

This project offers two distinct ways to run the environment locally, each serving a different purpose in the development lifecycle.

### 1. Using .NET Aspire (Inner-Loop Development)
**Best for:** Backend developers actively writing code, debugging, and needing hot-reload.

.NET Aspire is the primary developer experience. When you run the `AppHost`, it natively executes the .NET backend APIs and the Node.js frontend directly on your machine while spinning up the necessary infrastructure (PostgreSQL, MQTT broker) in Docker containers.

```bash
# Navigate to the AppHost directory and run the project
cd WeatherStation.AppHost
dotnet run
```
*This will launch the Aspire Developer Dashboard where you can view logs, distributed traces, and environment variables across all running services.*

### 2. Using Docker Compose (Container Verification & Testing)
**Best for:** Verifying container builds, CI/CD integration, and frontend/QA engineers who want to run the full stack without installing the .NET SDK.

While Aspire is great for writing code, the `docker-compose.yml` file allows you to spin up the entire application stack—including the API and frontend—inside isolated Docker containers. This ensures that the `Dockerfile` for each service is correct and production-ready.

To run the containerized stack:
```bash
# Copy the example environment variables
cp .env.example .env

# Start the stack in the background
docker-compose up -d
```

### Why Both?
You might wonder if it's redundant to have both an Aspire AppHost and a `docker-compose.yml`. They are actually complementary:
* **Aspire AppHost** provides the ultimate debugging and code-editing experience (F5 inner-loop).
* **Docker Compose** allows you to verify the final containerized artifacts before they go to production, and provides an easy way for non-.NET teammates to spin up the backend dependencies.

## Simulating Device Data

If you don't have the physical ESP8266 weather station device running, you can simulate incoming telemetry to test the backend API and frontend dashboard.

A bash script is provided in the root of the repository to generate mock data and publish it to the local MQTT broker:

```bash
# Make sure your environment (Aspire or Docker Compose) is running first!
./publish_mock_telemetry.sh
```

This script uses a temporary Docker container (`eclipse-mosquitto`) to send a JSON payload with a dummy temperature, humidity, and barometric pressure reading over MQTT to the `weather/telemetry` topic. You should see the data appear in your frontend shortly after running it.
