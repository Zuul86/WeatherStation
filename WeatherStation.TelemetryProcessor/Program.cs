using Microsoft.AspNetCore.Mvc;
using Dapr.Client;

var builder = WebApplication.CreateBuilder(args);

// Add service defaults and OpenTelemetry
builder.AddServiceDefaults();

// Add Dapr Client
builder.Services.AddDaprClient();

var app = builder.Build();

app.MapDefaultEndpoints();

// Define Dapr input binding handler
app.MapPost("/mqtt-telemetry", async ([FromBody] TelemetryPayload payload, [FromServices] DaprClient daprClient, ILogger<Program> logger) =>
{
    logger.LogInformation("Received telemetry reading: Temp={Temp}, Humid={Humid}, Pressure={Pressure}", 
        payload.SensorT, payload.SensorH, payload.SensorBp);

    try
    {
        // Design: Save to Dapr state store
        // PartitionKey is derived from AppID ("Telemetry")
        // RowKey is Date formatted as ISO 8601 UTC string (e.g. YYYY-MM-DDTHH:mm:ssZ)
        var readingTime = DateTimeOffset.FromUnixTimeSeconds(payload.Time).UtcDateTime;
        var rowKey = readingTime.ToString("o"); // Round-trip date/time pattern (ISO 8601)

        await daprClient.SaveStateAsync("statestore", rowKey, payload);
        logger.LogInformation("Successfully stored telemetry in Dapr state store with key: {Key}", rowKey);
        
        return Results.Ok();
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to store telemetry reading in Dapr state store.");
        return Results.Problem("Failed to store telemetry reading.");
    }
});

app.Run();

// DTO representing the incoming JSON payload from ESP8266
public record TelemetryPayload(
    [property: System.Text.Json.Serialization.JsonPropertyName("id")] string Id,
    [property: System.Text.Json.Serialization.JsonPropertyName("time")] long Time,
    [property: System.Text.Json.Serialization.JsonPropertyName("sensor_h")] double SensorH,
    [property: System.Text.Json.Serialization.JsonPropertyName("sensor_t")] double SensorT,
    [property: System.Text.Json.Serialization.JsonPropertyName("sensor_bp")] double SensorBp,
    [property: System.Text.Json.Serialization.JsonPropertyName("lat")] double Lat,
    [property: System.Text.Json.Serialization.JsonPropertyName("long")] double Long
);
