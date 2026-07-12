# CI/CD: Deploying to AKS with Helm & Dapr

This guide explains how to set up **GitHub Actions** to build, package, and deploy your Dapr-enabled WeatherStation microservices to **Azure Kubernetes Service (AKS)** using **Helm**.

---

## 1. How the CI/CD Pipeline Works

Your updated workflow file at [.github/workflows/deploy.yml](file:///workspaces/WeatherStation/.github/workflows/deploy.yml) performs the following automated steps upon every push to the `master` branch:

1.  **Code Validation**: Restores and builds the .NET and Angular workspaces to verify compilation.
2.  **Azure Authentication**: Logs in to Azure securely via OIDC (federated credentials).
3.  **Container Build & Push**: Uses Docker to build container images for all three services and pushes them to your Azure Container Registry (ACR) tagged with both `latest` and the unique `github.sha` (git commit hash).
4.  **AKS Connection**: Standardizes context to target your AKS cluster.
5.  **Kubernetes Secrets Initialization**: Pre-creates the Dapr connection secrets (`iothub-secrets` and `dapr-postgres-secrets`) directly in the Kubernetes namespace using secrets fetched from GitHub.
6.  **Helm Deployment**: Runs `helm upgrade --install` on your generated chart in [publish-k8s-out](file:///workspaces/WeatherStation/publish-k8s-out), injecting the newly built container image tags dynamically.

---

## 2. GitHub Secrets Configuration Checklist

To authorize and run this pipeline, you must configure the following secrets in your GitHub repository (**Settings -> Secrets and variables -> Actions -> Secrets**):

| Secret Name | Description | Example / Format |
| :--- | :--- | :--- |
| `AZURE_CLIENT_ID` | OIDC App Registration Client ID | `00000000-0000-0000-0000-000000000000` |
| `AZURE_TENANT_ID` | Active Directory Tenant ID | `00000000-0000-0000-0000-000000000000` |
| `AZURE_SUBSCRIPTION_ID` | target Azure Subscription ID | `00000000-0000-0000-0000-000000000000` |
| `AZURE_RESOURCE_GROUP` | Resource group containing AKS | `rg-weatherstation` |
| `AKS_CLUSTER_NAME` | Name of your AKS cluster | `aks-weatherstation` |
| `ACR_NAME` | Azure Container Registry name | `weatheracr` (omit `.azurecr.io`) |
| `POSTGRES_PASSWORD` | PostgreSQL Admin password | `my-secure-db-password` |
| `POSTGRES_CONNECTION_STRING` | Dapr state store connection string | `Host=postgres-service;Port=5432;Database=postgres;Username=postgres;Password=my-secure-db-password;SslMode=Disable;` |
| `IOTHUB_CONNECTION_STRING` | Azure IoT Hub connection string | `HostName=my-hub.azure-devices.net;SharedAccessKeyName=service;SharedAccessKey=...` |

---

## 3. Pre-requisites to Run Once on Azure

For the pipeline to deploy successfully, you must run these two Azure CLI setup commands once:

### 1. Enable Dapr on your AKS Cluster
Ensure the Dapr control plane is active in your AKS cluster so the sidecar injectors are running:
```bash
az aks update --resource-group <rg-name> --name <cluster-name> --enable-dapr
```

### 2. Attach ACR to your AKS Cluster
Allow AKS worker nodes to authenticate and pull your built images from ACR securely:
```bash
az aks update --resource-group <rg-name> --name <cluster-name> --attach-acr <acr-name>
```

---

## 4. Helm Customizations Applied

To ensure Dapr and Helm cooperate seamlessly, the following file updates have been applied in your workspace:

1.  **Dapr Sidecar Annotations**:
    *   In [publish-k8s-out/templates/telemetryprocessor/deployment.yaml](file:///workspaces/WeatherStation/publish-k8s-out/templates/telemetryprocessor/deployment.yaml#L17-L21): Added Dapr annotations so that the AKS operator injects the Dapr sidecar and binds it to port `8080` (where it expects to receive the IoT Hub binding payloads).
    *   In [publish-k8s-out/templates/api/deployment.yaml](file:///workspaces/WeatherStation/publish-k8s-out/templates/api/deployment.yaml#L17-L19): Added Dapr annotations to enable service-to-service communication.
2.  **Dapr Components in Chart**:
    *   Copied the production Dapr components directly into [publish-k8s-out/templates/dapr-mqtt-binding.yaml](file:///workspaces/WeatherStation/publish-k8s-out/templates/dapr-mqtt-binding.yaml) and [publish-k8s-out/templates/dapr-statestore.yaml](file:///workspaces/WeatherStation/publish-k8s-out/templates/dapr-statestore.yaml) so Helm treats them as native cluster resources.
    *   Renamed the state store's secret reference to `dapr-postgres-secrets` to prevent name collision with the PostgreSQL container's native database secrets.
