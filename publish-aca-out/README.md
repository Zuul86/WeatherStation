# Azure Container Apps Deployment

This folder contains an Azure Container Apps deployment equivalent to the Helm-based Kubernetes deployment in `publish-k8s-out`.

## What is included

- `main.bicep` - root deployment that creates an Azure Container Apps environment, Azure Container Registry integration, and deploys the WeatherStation services as Container Apps
- `app.bicep` - frontend container app for the Angular web UI
- `parameters.json` - example parameter file for image references and secrets

## Deploy

Build and push the container images to your Azure Container Registry, then deploy with Azure CLI:

```bash
az deployment group create \
  --resource-group <resource-group> \
  --template-file publish-aca-out/main.bicep \
  --parameters @publish-aca-out/parameters.json
```

If the API app is exposed on a public Container Apps hostname, set `api_external_url` to that value in `parameters.json` or pass it as an override.

## Notes

- This deployment uses the existing Azure artifacts in `azure-artifacts/` for the Container Apps modules.
- The Angular frontend container is configured to read `API_URL` from the environment at startup.
- Postgres and MQTT broker are deployed as private Container Apps inside the same Container Apps environment.
