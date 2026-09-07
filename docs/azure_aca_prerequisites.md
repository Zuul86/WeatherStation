# Azure Container Apps & Aspire Prerequisite Setup Guide

This guide walks you through the step-by-step Azure CLI commands required to provision prerequisite infrastructure and set up GitHub Actions OIDC (OpenID Connect) authentication for deploying the WeatherStation application to Azure Container Apps (ACA) using .NET Aspire.

---

## Step 1: Set Variables

Open your terminal and configure these variables for your environment:

```bash
RESOURCE_GROUP="rg-weatherstation-prod"
LOCATION="northcentralus"                       # Recommended for Milwaukee / Midwest (Chicago)
IOTHUB_NAME="iothub-weatherstation-$RANDOM"     # Must be globally unique
GH_REPO="Zuul86/WeatherStation"                 # Replace with your GitHub repository (owner/repo)
APP_NAME="github-actions-weatherstation"
```

---

## Step 2: Register Azure Resource Providers (One-Time Setup)

Ensure the required Azure Resource Providers are registered on your subscription:

```bash
# Register Azure Container Apps provider
az provider register --namespace Microsoft.App

# Register Azure Container Registry provider
az provider register --namespace Microsoft.ContainerRegistry

# Register Log Analytics / Operational Insights provider
az provider register --namespace Microsoft.OperationalInsights

# Register Azure IoT Hub provider
az provider register --namespace Microsoft.Devices
```

To verify registration status:
```bash
az provider show --namespace Microsoft.App --query "registrationState" -o tsv
az provider show --namespace Microsoft.ContainerRegistry --query "registrationState" -o tsv
az provider show --namespace Microsoft.OperationalInsights --query "registrationState" -o tsv
az provider show --namespace Microsoft.Devices --query "registrationState" -o tsv
```

---

## Step 3: Create Resource Group & Azure IoT Hub

1. **Create the Resource Group**:
   ```bash
   az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
   ```

2. **Create the IoT Hub (Free Tier `F1` or Standard `S1`)**:
   ```bash
   az iot hub create \
     --resource-group "$RESOURCE_GROUP" \
     --name "$IOTHUB_NAME" \
     --sku F1 \
     --location "$LOCATION" \
     --partition-count 2
   ```

3. **Create the Required Consumer Group**:
   The Dapr binding component (`deploy/dapr/components/dapr-mqtt-binding.yaml`) listens using the `telemetry-processor-consumer` consumer group:
   ```bash
   az iot hub consumer-group create \
     --hub-name "$IOTHUB_NAME" \
     --name "telemetry-processor-consumer" \
     --resource-group "$RESOURCE_GROUP"
   ```

4. **Retrieve the IoT Hub Connection String**:
   Save this connection string to add as a GitHub secret (`IOTHUB_CONNECTION_STRING`):
   ```bash
   az iot hub connection-string show \
     --hub-name "$IOTHUB_NAME" \
     --resource-group "$RESOURCE_GROUP" \
     --policy-name iothubowner \
     --query connectionString \
     --output tsv
   ```

---

## Step 4: Configure GitHub Actions OIDC Authentication & Azure RBAC

Aspire uses passwordless OpenID Connect (OIDC) to authenticate from GitHub Actions.

> [!IMPORTANT]
> When Aspire deploys to Azure Container Apps, it creates a User-Assigned Managed Identity and assigns it the `AcrPull` role on the Azure Container Registry. 
> Therefore, the Service Principal requires **both** `Contributor` and `User Access Administrator` (or `Owner`) roles on the Subscription.

1. **Retrieve Subscription and Tenant IDs**:
   ```bash
   SUBSCRIPTION_ID=$(az account show --query id -o tsv)
   TENANT_ID=$(az account show --query tenantId -o tsv)
   ```

2. **Create the Microsoft Entra App Registration & Service Principal**:
   ```bash
   CLIENT_ID=$(az ad app create --display-name "$APP_NAME" --query appId -o tsv)
   az ad sp create --id "$CLIENT_ID"
   ```

3. **Assign Required Roles (`Contributor` + `User Access Administrator`)**:
   ```bash
   # 1. Contributor - Allows creating Container Apps, ACR, Log Analytics, etc.
   az role assignment create \
     --role "Contributor" \
     --assignee "$CLIENT_ID" \
     --scope "/subscriptions/$SUBSCRIPTION_ID"

   # 2. User Access Administrator - Allows Aspire to grant AcrPull role to ACA Managed Identity
   az role assignment create \
     --role "User Access Administrator" \
     --assignee "$CLIENT_ID" \
     --scope "/subscriptions/$SUBSCRIPTION_ID"
   ```

4. **Add GitHub OIDC Federated Credentials**:
   ```bash
   # Credential for GitHub Environment (production)
   az ad app federated-credential create \
     --id "$CLIENT_ID" \
     --parameters "{
       \"name\": \"github-actions-production-env\",
       \"issuer\": \"https://token.actions.githubusercontent.com\",
       \"subject\": \"repo:$GH_REPO:environment:production\",
       \"description\": \"GitHub Actions OIDC for production environment\",
       \"audiences\": [\"api://AzureADTokenExchange\"]
     }"

   # Credential for master branch push triggers
   az ad app federated-credential create \
     --id "$CLIENT_ID" \
     --parameters "{
       \"name\": \"github-actions-master\",
       \"issuer\": \"https://token.actions.githubusercontent.com\",
       \"subject\": \"repo:$GH_REPO:ref:refs/heads/master\",
       \"description\": \"GitHub Actions OIDC for master branch\",
       \"audiences\": [\"api://AzureADTokenExchange\"]
     }"
   ```

---

## Step 5: Configure GitHub Secrets and Variables

In your GitHub repository, navigate to **Settings** → **Secrets and variables** → **Actions** (or within an Environment named `production`) and add the following:

### Secrets
| Secret Name | Description / Source |
| :--- | :--- |
| `AZURE_CLIENT_ID` | Application (Client) ID from Step 4 (`$CLIENT_ID`) |
| `AZURE_TENANT_ID` | Azure Tenant ID (`$TENANT_ID`) |
| `AZURE_SUBSCRIPTION_ID` | Azure Subscription ID (`$SUBSCRIPTION_ID`) |
| `POSTGRES_PASSWORD` | Strong password to initialize the PostgreSQL database |
| `IOTHUB_CONNECTION_STRING` | Connection string output from Step 3 (`iothubowner`) |

### Variables
| Variable Name | Value / Description |
| :--- | :--- |
| `AZURE_RESOURCE_GROUP` | `rg-weatherstation-prod` |
| `AZURE_LOCATION` | `northcentralus` |

---

## Step 6: Deploy

### Option A: Via GitHub Actions CI/CD
Push any commit to the `master` branch. The `.github/workflows/deploy.yml` workflow will automatically run `aspire deploy`, build container images, provision the ACA environment, and deploy all microservices.

### Option B: From Your Local Terminal
If you have the [Aspire CLI](https://aspire.dev) and Azure CLI installed locally:

```bash
Azure__SubscriptionId="$SUBSCRIPTION_ID" \
Azure__ResourceGroup="$RESOURCE_GROUP" \
Azure__Location="$LOCATION" \
Parameters__postgres_password="<your-password>" \
Parameters__iothub_connection_string="<your-iothub-connection-string>" \
aspire deploy --apphost ./WeatherStation.AppHost/WeatherStation.AppHost.csproj --environment production
```
