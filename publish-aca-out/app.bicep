@description('The location for the resource(s) to be deployed.')
param location string = resourceGroup().location

param aca_outputs_azure_container_apps_environment_default_domain string
param aca_outputs_azure_container_apps_environment_id string
param app_containerimage string
param api_external_url string
param aca_outputs_azure_container_registry_endpoint string
param aca_outputs_azure_container_registry_managed_identity_id string

resource app 'Microsoft.App/containerApps@2025-10-02-preview' = {
  name: 'app'
  location: location
  properties: {
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 80
        transport: 'http'
      }
      registries: [
        {
          server: aca_outputs_azure_container_registry_endpoint
          identity: aca_outputs_azure_container_registry_managed_identity_id
        }
      ]
    }
    environmentId: aca_outputs_azure_container_apps_environment_id
    template: {
      containers: [
        {
          image: app_containerimage
          name: 'app'
          env: [
            {
              name: 'API_URL'
              value: api_external_url
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
      }
    }
  }
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${aca_outputs_azure_container_registry_managed_identity_id}': { }
    }
  }
}
