using Azure.Data.Tables;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

// Add service defaults and OpenTelemetry
builder.AddServiceDefaults();

// Add Azure Table Client (configured via Aspire connection string "weather-data")
builder.AddAzureTableClient("weather-data");

var app = builder.Build();

app.MapDefaultEndpoints();

// Define Dapr input binding handler
app.MapPost("/mqtt-telemetry", async ([FromBody] TelemetryPayload payload, [FromServices] TableServiceClient tableServiceClient, ILogger<Program> logger) =>
{
    logger.LogInformation("Received telemetry reading: Temp={Temp}, Humid={Humid}, Pressure={Pressure}", 
        payload.SensorT, payload.SensorH, payload.SensorBp);

    try
    {
        var tableClient = tableServiceClient.GetTableClient("weatherdata");
        await tableClient.CreateIfNotExistsAsync();

        // Design: PartitionKey = "Telemetry" (as it's a single device station)
        // RowKey = Date formatted as ISO 8601 UTC string (e.g. YYYY-MM-DDTHH:mm:ssZ)
        var readingTime = DateTimeOffset.FromUnixTimeSeconds(payload.Time).UtcDateTime;
        var rowKey = readingTime.ToString("o"); // Round-trip date/time pattern (ISO 8601)

        var entity = new TableEntity("Telemetry", rowKey)
        {
            { "Temperature", payload.SensorT },
            { "Humidity", payload.SensorH },
            { "BarometricPressure", payload.SensorBp },
            { "Latitude", payload.Lat },
            { "Longitude", payload.Long },
            { "EpochTime", payload.Time }
        };

        await tableClient.UpsertEntityAsync(entity);
        logger.LogInformation("Successfully stored telemetry with RowKey: {RowKey}", rowKey);
        
        return Results.Ok();
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to store telemetry reading in Azure Table Storage.");
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
