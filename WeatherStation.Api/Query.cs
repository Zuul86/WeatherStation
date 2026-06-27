using Dapr.Client;
using HotChocolate;

namespace WeatherStation.Api;

public class Query
{
    [GraphQLName("listWeatherData")]
    public async Task<WeatherDataResult> GetListWeatherData(
        [Service] DaprClient daprClient,
        int limit = 1000)
    {
        var payloads = await LoadTelemetryPayloadsAsync(daprClient, limit);
        var items = payloads
            .Select(x => new WeatherDataItem(x.SensorBp, x.SensorH, x.SensorT, x.Time))
            .ToList();
        return new WeatherDataResult(items);
    }

    [GraphQLName("weatherReadings")]
    public async Task<List<WeatherReadingItem>> GetWeatherReadings(
        [Service] DaprClient daprClient,
        string? filter = null,
        string? sort = null)
    {
        _ = filter;
        _ = sort;
        return await LoadWeatherReadingsAsync(daprClient, 1000);
    }

    [GraphQLName("latestReadings")]
    public async Task<List<WeatherReadingItem>> GetLatestReadings(
        [Service] DaprClient daprClient,
        int count = 10)
    {
        return await LoadWeatherReadingsAsync(daprClient, count);
    }

    [GraphQLName("weatherReading")]
    public async Task<WeatherReadingItem?> GetWeatherReading(
        [Service] DaprClient daprClient,
        int id)
    {
        var items = await LoadWeatherReadingsAsync(daprClient, 1000);
        return items.FirstOrDefault(x => x.Id == id);
    }

    private static async Task<List<TelemetryPayloadDto>> LoadTelemetryPayloadsAsync(DaprClient daprClient, int limit)
    {
        var items = new List<TelemetryPayloadDto>();

        try
        {
            var queryJson = $$"""
            {
                "page": {
                    "limit": {{Math.Max(limit, 1)}}
                }
            }
            """;

            var response = await daprClient.QueryStateAsync<TelemetryPayloadDto>("statestore", queryJson);

            if (response?.Results != null)
            {
                foreach (var result in response.Results)
                {
                    var payload = result.Data;
                    if (payload != null)
                    {
                        items.Add(payload);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error querying Dapr state store: {ex}");
        }

        return items
            .OrderByDescending(x => x.Time)
            .Take(Math.Max(limit, 1))
            .ToList();
    }

    private static async Task<List<WeatherReadingItem>> LoadWeatherReadingsAsync(DaprClient daprClient, int limit)
    {
        var payloads = await LoadTelemetryPayloadsAsync(daprClient, limit);
        return payloads
            .Select((payload, index) => new WeatherReadingItem(
                index + 1,
                DateTimeOffset.FromUnixTimeSeconds(payload.Time).UtcDateTime.ToString("o"),
                ConvertToFahrenheit(payload.SensorT),
                payload.SensorH,
                payload.SensorBp,
                null))
            .ToList();
    }

    private static double ConvertToFahrenheit(double celsius)
        => (celsius * 9.0 / 5.0) + 32.0;
}

public record WeatherDataResult(List<WeatherDataItem> Items);

public record WeatherDataItem(
    [property: GraphQLName("sensor_bp")] double SensorBp,
    [property: GraphQLName("sensor_h")] double SensorH,
    [property: GraphQLName("sensor_t")] double SensorT,
    [property: GraphQLName("time")] long Time
);

public record WeatherReadingItem(
    [property: GraphQLName("id")] int Id,
    [property: GraphQLName("timestamp")] string Timestamp,
    [property: GraphQLName("temperatureFahrenheit")] double TemperatureFahrenheit,
    [property: GraphQLName("humidity")] double Humidity,
    [property: GraphQLName("pressure")] double Pressure,
    [property: GraphQLName("deviceId")] string? DeviceId
);

// DTO representing the state stored in Dapr
public record TelemetryPayloadDto(
    [property: System.Text.Json.Serialization.JsonPropertyName("sensor_bp")] double SensorBp,
    [property: System.Text.Json.Serialization.JsonPropertyName("sensor_h")] double SensorH,
    [property: System.Text.Json.Serialization.JsonPropertyName("sensor_t")] double SensorT,
    [property: System.Text.Json.Serialization.JsonPropertyName("time")] long Time
);
