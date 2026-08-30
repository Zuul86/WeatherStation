using Azure.Provisioning.AppContainers;
using CommunityToolkit.Aspire.Hosting.Azure.Dapr;
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
    .WithMetadata("tableName", "state");

if (builder.ExecutionContext.IsRunMode)
{
    stateStore.WaitFor(postgres);
    stateStore.WithMetadata("connectionString", "host=localhost port=5432 dbname=weatherdb user=postgres password=postgres sslmode=disable");
}
else
{
    stateStore.WithMetadata("connectionString", ReferenceExpression.Create($"host=postgres port=5432 dbname=postgres user=postgres password={password} sslmode=disable"));

    aca.WithParameter("postgresPassword", password);

    stateStore.WithAnnotation(new AzureDaprComponentPublishingAnnotation(infrastructure =>
    {
        var managedEnv = infrastructure.GetProvisionableResources()
            .OfType<ContainerAppManagedEnvironment>()
            .FirstOrDefault();

        if (managedEnv is not null)
        {
            var pgPasswordParam = new Azure.Provisioning.ProvisioningParameter("postgresPassword", typeof(string))
            {
                IsSecure = true
            };

            var daprComponent = AzureDaprHostingExtensions.CreateDaprComponent(
                "stateStore",
                "statestore",
                "state.postgresql",
                "v1");

            daprComponent.Parent = managedEnv;
            daprComponent.Secrets =
            [
                new ContainerAppWritableSecret
                {
                    Name = "postgres-connection-string",
                    Value = Azure.Provisioning.Expressions.BicepFunction.Interpolate($"host=postgres port=5432 dbname=postgres user=postgres password={pgPasswordParam} sslmode=disable")
                }
            ];
            daprComponent.Metadata =
            [
                new ContainerAppDaprMetadata { Name = "connectionString", SecretRef = "postgres-connection-string" },
                new ContainerAppDaprMetadata { Name = "tableName", Value = "state" },
                new ContainerAppDaprMetadata { Name = "actorStateStore", Value = "false" }
            ];

            stateStore.AddScopes(daprComponent);

            infrastructure.Add(pgPasswordParam);
            infrastructure.Add(daprComponent);
        }
    }));
}



// Configure Mosquitto MQTT Broker
var mqttBroker = builder.AddDockerfile("mqtt-broker", "../.devdeploy/mosquitto")
    .WithEndpoint(port: 1883, targetPort: 1883, name: "mqtt")
    .WithAnnotation(new Aspire.Hosting.ApplicationModel.ProxySupportAnnotation { ProxyEnabled = false });

// Configure Dapr MQTT input binding
var mqttTelemetry = builder.AddDaprComponent("mqtt-telemetry", "bindings.mqtt")
    .WithMetadata("topic", "weather/telemetry")
    .WithMetadata("consumerID", "telemetry-processor-consumer");

if (builder.ExecutionContext.IsRunMode)
{
    mqttTelemetry.WithMetadata("url", "tcp://localhost:1883");
}
else
{
    mqttTelemetry.WithMetadata("url", "tcp://mqtt-broker:1883");

    mqttTelemetry.WithAnnotation(new AzureDaprComponentPublishingAnnotation(infrastructure =>
    {
        var managedEnv = infrastructure.GetProvisionableResources()
            .OfType<ContainerAppManagedEnvironment>()
            .FirstOrDefault();

        if (managedEnv is not null)
        {
            var daprComponent = AzureDaprHostingExtensions.CreateDaprComponent(
                "mqttTelemetry",
                "mqtt-telemetry",
                "bindings.mqtt",
                "v1");

            daprComponent.Parent = managedEnv;
            daprComponent.Metadata =
            [
                new ContainerAppDaprMetadata { Name = "url", Value = "tcp://mqtt-broker:1883" },
                new ContainerAppDaprMetadata { Name = "topic", Value = "weather/telemetry" },
                new ContainerAppDaprMetadata { Name = "consumerID", Value = "telemetry-processor-consumer" }
            ];

            mqttTelemetry.AddScopes(daprComponent);

            infrastructure.Add(daprComponent);
        }
    }));
}

// Add Dapr sidecar to TelemetryProcessor
var telemetryProcessor = builder.AddProject<Projects.WeatherStation_TelemetryProcessor>("telemetryprocessor")
    .WithHttpEndpoint(port: 8080, targetPort: 8080, name: "http")
    .WithReference(postgres)
    .WithDaprSidecar(sidecar => sidecar
        .WithOptions(new DaprSidecarOptions
        {
            AppId = "telemetry",
            AppPort = 8080,
        })
        .WithReference(stateStore)
        .WithReference(mqttTelemetry));

if (builder.ExecutionContext.IsRunMode)
{
    telemetryProcessor.WaitFor(postgres);
}

// Configure API with Dapr sidecar
var api = builder.AddProject<Projects.WeatherStation_Api>("api")
    .WithHttpEndpoint(port: 5081, targetPort: 8080, name: "http")
    .WithReference(postgres)
    .WithDaprSidecar(sidecar => sidecar
        .WithOptions(new DaprSidecarOptions
        {
            AppId = "api",
            AppPort = 8080
        })
        .WithReference(stateStore))
    .WithExternalHttpEndpoints();

if (builder.ExecutionContext.IsRunMode)
{
    api.WaitFor(postgres);
}

// Configure Angular Frontend App using the existing Docker build
builder.AddDockerfile("app", "../WeatherStation.Web")
    .WithReference(api)
    .WithEnvironment("API_URL", api.GetEndpoint("http"))
    .WithHttpEndpoint(port: 4200, targetPort: 80, name: "http")
    .WithExternalHttpEndpoints();

builder.Build().Run();

