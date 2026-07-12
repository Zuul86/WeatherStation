using CommunityToolkit.Aspire.Hosting.Dapr;
using Microsoft.Extensions.Hosting;
using Aspire.Hosting.Kubernetes;

var builder = DistributedApplication.CreateBuilder(args);

var k8s = builder.AddKubernetesEnvironment("k8s");

// Configure local PostgreSQL database for Dapr State Store
var password = builder.AddParameter("postgres-password", "postgres", secret: true);
var postgres = builder.AddPostgres("postgres", password: password, port: 5432)
    .WithImage("postgres")
    .WithPgAdmin();
var weatherDb = postgres.AddDatabase("weatherdb");

var daprPath = builder.Environment.IsDevelopment() ? "../.devdeploy/dapr/components" : "../deploy/dapr/components";

// Configure MQTT Mosquitto broker (Dev only)
if (builder.Environment.IsDevelopment())
{
    var mqttBroker = builder.AddDockerfile("mqtt-broker", "../.devdeploy/mosquitto")
        .WithEndpoint(port: 1883, targetPort: 1883, name: "mqtt")
        .WithAnnotation(new Aspire.Hosting.ApplicationModel.ProxySupportAnnotation { ProxyEnabled = false });
}

// Add Dapr sidecar to TelemetryProcessor
var telemetryProcessor = builder.AddProject<Projects.WeatherStation_TelemetryProcessor>("telemetryprocessor")
    .WithHttpEndpoint(port: 8080, name: "http")
    .WithDaprSidecar(new DaprSidecarOptions
    {
        AppId = "Telemetry",
        ResourcesPaths = [daprPath],
        AppPort = 8080,
        PlacementHostAddress = "",
        SchedulerHostAddress = ""
    });

// Configure API with Dapr sidecar
var api = builder.AddProject<Projects.WeatherStation_Api>("api")
    .WithHttpEndpoint(port: 5081, name: "http")
    .WithDaprSidecar(new DaprSidecarOptions
    {
        AppId = "Api",
        ResourcesPaths = [daprPath],
        PlacementHostAddress = "",
        SchedulerHostAddress = ""
    })
    .WithExternalHttpEndpoints();

// Configure Angular Frontend App using the existing Docker build
builder.AddDockerfile("app", "../WeatherStation.Web")
    .WithReference(api)
    .WithHttpEndpoint(port: 4200, targetPort: 80, name: "http")
    .WithExternalHttpEndpoints();

builder.Build().Run();
