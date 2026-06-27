using CommunityToolkit.Aspire.Hosting.Dapr;

var builder = DistributedApplication.CreateBuilder(args);

// Configure local PostgreSQL database for Dapr State Store
var password = builder.AddParameter("postgres-password", "postgres", secret: true);
var postgres = builder.AddPostgres("postgres", password: password, port: 5432)
    .WithImage("postgres")
    .WithPgAdmin();
var weatherDb = postgres.AddDatabase("weatherdb");

// Configure MQTT Mosquitto broker
var mqttBroker = builder.AddDockerfile("mqtt-broker", ".")
    .WithEndpoint(port: 1883, targetPort: 1883, name: "mqtt")
    .WithAnnotation(new Aspire.Hosting.ApplicationModel.ProxySupportAnnotation { ProxyEnabled = false });

// Add Dapr sidecar to TelemetryProcessor
var telemetryProcessor = builder.AddProject<Projects.WeatherStation_TelemetryProcessor>("telemetryprocessor")
    .WithDaprSidecar(new DaprSidecarOptions
    {
        AppId = "Telemetry",
        ResourcesPaths = ["../dapr/components"],
        AppPort = 8080
    });

// Configure API with Dapr sidecar
var api = builder.AddProject<Projects.WeatherStation_Api>("api")
    .WithHttpEndpoint(port: 5081, name: "http")
    .WithDaprSidecar(new DaprSidecarOptions
    {
        AppId = "Api",
        ResourcesPaths = ["../dapr/components"]
    });

// Configure Angular Frontend App
builder.AddNpmApp("app", "../WeatherStation.Web")
    .WithReference(api)
    .WithHttpEndpoint(env: "PORT");

builder.Build().Run();
