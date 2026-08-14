targetScope = 'resourceGroup'

param location string = resourceGroup().location
param principalId string = ''
param api_containerimage string
param api_containerport string = '8080'
param telemetryprocessor_containerimage string
param telemetryprocessor_containerport string = '8080'
param app_containerimage string
param mqtt_broker_containerimage string
@secure()
param postgres_password_value string
param api_external_url string = ''

module aca_acr '../azure-artifacts/aca-acr/aca-acr.bicep' = {
  name: 'aca-acr'
  params: {
    location: location
  }
}

module aca '../azure-artifacts/aca/aca.bicep' = {
  name: 'aca'
  params: {
    location: location
    aca_acr_outputs_name: aca_acr.outputs.name
    userPrincipalId: principalId
  }
}

module postgres '../azure-artifacts/postgres/postgres.bicep' = {
  name: 'postgres'
  params: {
    location: location
    aca_outputs_azure_container_apps_environment_default_domain: aca.outputs.AZURE_CONTAINER_APPS_ENVIRONMENT_DEFAULT_DOMAIN
    aca_outputs_azure_container_apps_environment_id: aca.outputs.AZURE_CONTAINER_APPS_ENVIRONMENT_ID
    postgres_password_value: postgres_password_value
  }
}

module mqttBroker '../azure-artifacts/mqtt-broker/mqtt-broker.bicep' = {
  name: 'mqtt-broker'
  params: {
    location: location
    aca_outputs_azure_container_apps_environment_default_domain: aca.outputs.AZURE_CONTAINER_APPS_ENVIRONMENT_DEFAULT_DOMAIN
    aca_outputs_azure_container_apps_environment_id: aca.outputs.AZURE_CONTAINER_APPS_ENVIRONMENT_ID
    mqtt_broker_containerimage: mqtt_broker_containerimage
    aca_outputs_azure_container_registry_endpoint: aca.outputs.AZURE_CONTAINER_REGISTRY_ENDPOINT
    aca_outputs_azure_container_registry_managed_identity_id: aca.outputs.AZURE_CONTAINER_REGISTRY_MANAGED_IDENTITY_ID
  }
}

module telemetryProcessor '../azure-artifacts/telemetryprocessor/telemetryprocessor.bicep' = {
  name: 'telemetryprocessor'
  params: {
    location: location
    aca_outputs_azure_container_apps_environment_default_domain: aca.outputs.AZURE_CONTAINER_APPS_ENVIRONMENT_DEFAULT_DOMAIN
    aca_outputs_azure_container_apps_environment_id: aca.outputs.AZURE_CONTAINER_APPS_ENVIRONMENT_ID
    telemetryprocessor_containerimage: telemetryprocessor_containerimage
    telemetryprocessor_containerport: telemetryprocessor_containerport
    aca_outputs_azure_container_registry_endpoint: aca.outputs.AZURE_CONTAINER_REGISTRY_ENDPOINT
    aca_outputs_azure_container_registry_managed_identity_id: aca.outputs.AZURE_CONTAINER_REGISTRY_MANAGED_IDENTITY_ID
  }
}

module api '../azure-artifacts/api/api.bicep' = {
  name: 'api'
  params: {
    location: location
    aca_outputs_azure_container_apps_environment_default_domain: aca.outputs.AZURE_CONTAINER_APPS_ENVIRONMENT_DEFAULT_DOMAIN
    aca_outputs_azure_container_apps_environment_id: aca.outputs.AZURE_CONTAINER_APPS_ENVIRONMENT_ID
    api_containerimage: api_containerimage
    api_containerport: api_containerport
    aca_outputs_azure_container_registry_endpoint: aca.outputs.AZURE_CONTAINER_REGISTRY_ENDPOINT
    aca_outputs_azure_container_registry_managed_identity_id: aca.outputs.AZURE_CONTAINER_REGISTRY_MANAGED_IDENTITY_ID
  }
}

module app 'app.bicep' = {
  name: 'app'
  params: {
    location: location
    aca_outputs_azure_container_apps_environment_default_domain: aca.outputs.AZURE_CONTAINER_APPS_ENVIRONMENT_DEFAULT_DOMAIN
    aca_outputs_azure_container_apps_environment_id: aca.outputs.AZURE_CONTAINER_APPS_ENVIRONMENT_ID
    app_containerimage: app_containerimage
    api_external_url: api_external_url
    aca_outputs_azure_container_registry_endpoint: aca.outputs.AZURE_CONTAINER_REGISTRY_ENDPOINT
    aca_outputs_azure_container_registry_managed_identity_id: aca.outputs.AZURE_CONTAINER_REGISTRY_MANAGED_IDENTITY_ID
  }
}
