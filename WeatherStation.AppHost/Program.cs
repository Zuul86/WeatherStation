using CommunityToolkit.Aspire.Hosting.Dapr;
using Microsoft.Extensions.Hosting;

var builder = DistributedApplication.CreateBuilder(args);

var aca = builder.AddAzureContainerAppEnvironment("aca")
    .WithDaprComponents();

// Configure PostgreSQL database for Dapr State Store
var password = builder.AddParameter("postgres-password", "postgres", secret: true);
var postgres = builder.AddPostgres("postgres", password: password, port: 5432)
    .WithImage("postgres")
    .WithPgAdmin();
var weatherDb = postgres.AddDatabase("weatherdb");

// Configure PostgreSQL-backed Dapr state store
var stateStore = builder.AddDaprComponent("statestore", "state.postgresql")
    .WithMetadata("actorStateStore", "false")
    .WithMetadata("tableName", "state")
    .WaitFor(postgres);

if (builder.ExecutionContext.IsRunMode)
{
    stateStore.WithMetadata("connectionString", "host=localhost port=5432 dbname=weatherdb user=postgres password=postgres sslmode=disable");
}
else
{
    stateStore.WithMetadata("connectionString", weatherDb.Resource.ConnectionStringExpression!);
}



IResourceBuilder<IDaprComponentResource> mqttTelemetry;

if (builder.ExecutionContext.IsRunMode)
{
    var mqttBroker = builder.AddDockerfile("mqtt-broker", "../.devdeploy/mosquitto")
        .WithEndpoint(port: 1883, targetPort: 1883, name: "mqtt")
        .WithAnnotation(new Aspire.Hosting.ApplicationModel.ProxySupportAnnotation { ProxyEnabled = false });

    mqttTelemetry = builder.AddDaprComponent("mqtt-telemetry", "bindings.mqtt")
        .WithMetadata("url", "tcp://localhost:1883")
        .WithMetadata("topic", "weather/telemetry")
        .WithMetadata("consumerID", "telemetry-processor-consumer");
}
else
{
    // Configure MQTT / IoT Hub Component
    var iothubConnectionString = builder.AddParameter("iothub-connection-string", secret: true);

    mqttTelemetry = builder.AddDaprComponent("mqtt-telemetry", "bindings.azure.iothub")
        .WithMetadata("connectionString", iothubConnectionString.Resource)
        .WithMetadata("consumerGroup", "telemetry-processor-consumer");
}

// Add Dapr sidecar to TelemetryProcessor
var telemetryProcessor = builder.AddProject<Projects.WeatherStation_TelemetryProcessor>("telemetryprocessor")
    .WithHttpEndpoint(port: 8080, name: "http")
    .WithReference(postgres)
    .WaitFor(postgres)
    .WithDaprSidecar(sidecar => sidecar
        .WithOptions(new DaprSidecarOptions
        {
            AppId = "Telemetry",
            AppPort = 8080,
        })
        .WithReference(stateStore)
        .WithReference(mqttTelemetry));

// Configure API with Dapr sidecar
var api = builder.AddProject<Projects.WeatherStation_Api>("api")
    .WithHttpEndpoint(port: 5081, name: "http")
    .WithReference(postgres)
    .WaitFor(postgres)
    .WithDaprSidecar(sidecar => sidecar
        .WithOptions(new DaprSidecarOptions
        {
            AppId = "Api",
        })
        .WithReference(stateStore))
    .WithExternalHttpEndpoints();

// Configure Angular Frontend App using the existing Docker build
builder.AddDockerfile("app", "../WeatherStation.Web")
    .WithReference(api)
    .WithHttpEndpoint(port: 4200, targetPort: 80, name: "http")
    .WithExternalHttpEndpoints();

builder.Build().Run();

