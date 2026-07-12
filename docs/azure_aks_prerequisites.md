# Azure & AKS Prerequisite Setup Guide

This guide walks you through the step-by-step Azure CLI commands required to provision the necessary infrastructure and set up GitHub Actions OIDC (OpenID Connect) authentication for deploying the WeatherStation application.

---

## Step 1: Initialize Variables

Open your terminal and define these environment variables to keep your commands consistent:

```bash
RESOURCE_GROUP="rg-weatherstation"
LOCATION="eastus"
ACR_NAME="weatheracr$RANDOM" # ACR names must be globally unique
AKS_CLUSTER_NAME="aks-weatherstation"
IOTHUB_NAME="iothub-weatherstation-$RANDOM" # IoT Hub names must be globally unique
GH_REPO="your-github-username/WeatherStation" # Replace with your GitHub Repository
```

---

## Step 2: Resource Group & ACR Provisioning

1.  **Create the Resource Group**:
    ```bash
    az group create --name $RESOURCE_GROUP --location $LOCATION
    ```

2.  **Create the Azure Container Registry (Basic Tier)**:
    ```bash
    az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic
    ```

---

## Step 3: Provision AKS with Dapr Enabled

1.  **Create the AKS Cluster**:
    *   This command provisions a cost-efficient single-node cluster utilizing a burstable `Standard_B2s` VM (2 vCPUs, 4 GiB RAM), which satisfies Dapr's resource requirements.
    ```bash
    az aks create \
      --resource-group $RESOURCE_GROUP \
      --name $AKS_CLUSTER_NAME \
      --node-count 1 \
      --node-vm-size Standard_B2s \
      --generate-ssh-keys
    ```

2.  **Enable the Dapr AKS Extension**:
    *   This installs the Dapr operator and sidecar injector services directly into your cluster.
    ```bash
    az aks update \
      --resource-group $RESOURCE_GROUP \
      --name $AKS_CLUSTER_NAME \
      --enable-dapr
    ```

3.  **Attach ACR to AKS**:
    *   Grant the AKS cluster permission to pull images from your container registry:
    ```bash
    az aks update \
      --resource-group $RESOURCE_GROUP \
      --name $AKS_CLUSTER_NAME \
      --attach-acr $ACR_NAME
    ```

---

## Step 4: Provision Azure IoT Hub

1.  **Create the IoT Hub (Free Tier - F1)**:
    ```bash
    az iot hub create \
      --resource-group $RESOURCE_GROUP \
      --name $IOTHUB_NAME \
      --sku F1
    ```

2.  **Create the Consumer Group**:
    *   The Dapr binding component (`mqtt-telemetry`) listens using the `telemetry-processor-consumer` consumer group:
    ```bash
    az iot hub consumer-group create \
      --hub-name $IOTHUB_NAME \
      --name telemetry-processor-consumer
    ```

3.  **Retrieve the IoT Hub Connection String**:
    *   Save this connection string to add as a GitHub secret later:
    ```bash
    az iot hub connection-string show --hub-name $IOTHUB_NAME --policy-name service --query connectionString -o tsv
    ```

---

## Step 5: Configure GitHub Actions OIDC Authentication

OIDC allows GitHub Actions to log in to Azure securely without storing permanent passwords/service principal keys.

1.  **Create an Azure AD App Registration**:
    ```bash
    APP_CLIENT_ID=$(az ad app create --display-name "github-actions-weatherstation" --query appId -o tsv)
    ```

2.  **Create a Service Principal**:
    ```bash
    az ad sp create --id $APP_CLIENT_ID
    ```

3.  **Create a Role Assignment**:
    *   Grant the Service Principal `Contributor` permissions on your resource group:
    ```bash
    RG_ID=$(az group show --name $RESOURCE_GROUP --query id -o tsv)
    az role assignment create \
      --role "Contributor" \
      --assignee $APP_CLIENT_ID \
      --scope $RG_ID
    ```

4.  **Configure Federated Credentials**:
    *   Establish a trust relationship between GitHub Actions and your App Registration (restricted to push events on your `master` branch):
    ```bash
    # Save the credential JSON to a temporary file
    cat <<EOF > credential-parameters.json
    {
      "name": "github-actions-oidc",
      "issuer": "https://token.actions.githubusercontent.com",
      "subject": "repo:${GH_REPO}:ref:refs/heads/master",
      "description": "Federated credential for GitHub Actions master branch deployment",
      "audiences": [
        "api://AzureADTokenExchange"
      ]
    }
    EOF

    # Apply the federated credential
    az ad app federated-credential create \
      --id $APP_CLIENT_ID \
      --parameters credential-parameters.json

    # Clean up the file
    rm credential-parameters.json
    ```

5.  **Retrieve Tenant and Subscription IDs**:
    *   Save these to add as GitHub secrets:
    ```bash
    az account show --query "{subscriptionId:id, tenantId:tenantId}" -o table
    ```

---

## Step 6: PostgreSQL Database Configuration

Your Helm chart contains a StatefulSet deployment of PostgreSQL (`publish-k8s-out/templates/postgres`). 

To connect the Dapr `statestore` component to it, configure your GitHub repository secrets as follows:
*   `POSTGRES_PASSWORD`: Choose a secure password (e.g. `MySecurePassword123`).
*   `POSTGRES_CONNECTION_STRING`: Set the connection string using the cluster's internal service name:
    ```text
    Host=postgres-service;Port=5432;Database=postgres;Username=postgres;Password=<your-postgres-password>;SslMode=Disable;
    ```
