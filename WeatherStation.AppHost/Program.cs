using Aspire.Hosting.Dapr;

var builder = DistributedApplication.CreateBuilder(args);

// Configure Azure Storage tables
var storage = builder.AddAzureStorage("storage").RunAsEmulator();
var tables = storage.AddTables("weather-data");

// Configure MQTT Mosquitto broker
var mqttBroker = builder.AddDockerfile("mqtt-broker", ".")
    .WithEndpoint(port: 1883, targetPort: 1883, name: "mqtt");

// Add Dapr sidecar to TelemetryProcessor
var telemetryProcessor = builder.AddProject<Projects.WeatherStation_TelemetryProcessor>("telemetryprocessor")
    .WithReference(tables)
    .WithDaprSidecar(new DaprSidecarOptions
    {
        AppId = "telemetryprocessor",
        ResourcesPaths = ["../dapr/components"]
    });

// Configure API
var api = builder.AddProject<Projects.WeatherStation_Api>("api")
    .WithReference(tables)
    .WithHttpEndpoint(port: 5081, name: "http");

// Configure Angular Frontend App
builder.AddNpmApp("app", "../WeatherStation.Web")
    .WithReference(api)
    .WithHttpEndpoint(env: "PORT");

builder.Build().Run();
