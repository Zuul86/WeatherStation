using Dapr.Client;
using HotChocolate;

namespace WeatherStation.Api;

public class Query
{
    private readonly string _stateStoreName;

    public Query(IConfiguration configuration)
    {
        _stateStoreName = configuration["DaprStateStoreName"] ?? "statestore";
    }

    [GraphQLName("listWeatherData")]
    public async Task<WeatherDataResult> GetListWeatherData(
        [Service] DaprClient daprClient,
        int limit = 1000)
    {
        var payloads = await LoadTelemetryPayloadsAsync(daprClient, _stateStoreName, limit);
        var items = payloads
            .Select(x => new WeatherDataItem(x.SensorBp, x.SensorH, x.SensorT, x.Time, x.Pm1_0, x.Pm2_5, x.Pm10_0))
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
        return await LoadWeatherReadingsAsync(daprClient, _stateStoreName, 1000);
    }

    [GraphQLName("latestReadings")]
    public async Task<List<WeatherReadingItem>> GetLatestReadings(
        [Service] DaprClient daprClient,
        int count = 10)
    {
        return await LoadWeatherReadingsAsync(daprClient, _stateStoreName, count);
    }

    [GraphQLName("paginatedReadings")]
    public async Task<WeatherReadingPageResult> GetPaginatedReadings(
        [Service] DaprClient daprClient,
        int pageNumber = 1,
        int pageSize = 10)
    {
        var safePageNumber = Math.Max(pageNumber, 1);
        var safePageSize = Math.Clamp(pageSize, 1, 50);

        var allPayloads = await LoadTelemetryPayloadsAsync(daprClient, _stateStoreName, 1000);
        var orderedPayloads = allPayloads
            .OrderByDescending(x => x.Time)
            .ToList();

        var totalCount = orderedPayloads.Count;
        var pagePayloads = orderedPayloads
            .Skip((safePageNumber - 1) * safePageSize)
            .Take(safePageSize)
            .ToList();

        var items = pagePayloads
            .Select((payload, index) => new WeatherReadingItem(
                (safePageNumber - 1) * safePageSize + index + 1,
                DateTimeOffset.FromUnixTimeSeconds(payload.Time).UtcDateTime.ToString("o"),
                ConvertToFahrenheit(payload.SensorT),
                payload.SensorH,
                payload.SensorBp,
                payload.Id,
                payload.Pm1_0,
                payload.Pm2_5,
                payload.Pm10_0))
            .ToList();

        return new WeatherReadingPageResult(totalCount, safePageNumber, safePageSize, items);
    }

    [GraphQLName("weatherReading")]
    public async Task<WeatherReadingItem?> GetWeatherReading(
        [Service] DaprClient daprClient,
        int id)
    {
        var items = await LoadWeatherReadingsAsync(daprClient, _stateStoreName, 1000);
        return items.FirstOrDefault(x => x.Id == id);
    }

    private static async Task<List<TelemetryPayloadDto>> LoadTelemetryPayloadsAsync(DaprClient daprClient, string stateStoreName, int limit)
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

            var response = await daprClient.QueryStateAsync<TelemetryPayloadDto>(stateStoreName, queryJson);

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

    private static async Task<List<WeatherReadingItem>> LoadWeatherReadingsAsync(DaprClient daprClient, string stateStoreName, int limit)
    {
        var payloads = await LoadTelemetryPayloadsAsync(daprClient, stateStoreName, limit);
        return payloads
            .Select((payload, index) => new WeatherReadingItem(
                index + 1,
                DateTimeOffset.FromUnixTimeSeconds(payload.Time).UtcDateTime.ToString("o"),
                ConvertToFahrenheit(payload.SensorT),
                payload.SensorH,
                payload.SensorBp,
                payload.Id,
                payload.Pm1_0,
                payload.Pm2_5,
                payload.Pm10_0))
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
    [property: GraphQLName("time")] long Time,
    [property: GraphQLName("pm1_0")] double Pm1_0 = 0,
    [property: GraphQLName("pm2_5")] double Pm2_5 = 0,
    [property: GraphQLName("pm10_0")] double Pm10_0 = 0
);

public record WeatherReadingItem(
    [property: GraphQLName("id")] int Id,
    [property: GraphQLName("timestamp")] string Timestamp,
    [property: GraphQLName("temperatureFahrenheit")] double TemperatureFahrenheit,
    [property: GraphQLName("humidity")] double Humidity,
    [property: GraphQLName("pressure")] double Pressure,
    [property: GraphQLName("deviceId")] string? DeviceId,
    [property: GraphQLName("pm1_0")] double Pm1_0 = 0,
    [property: GraphQLName("pm2_5")] double Pm2_5 = 0,
    [property: GraphQLName("pm10_0")] double Pm10_0 = 0
);

public record WeatherReadingPageResult(
    [property: GraphQLName("totalCount")] int TotalCount,
    [property: GraphQLName("pageNumber")] int PageNumber,
    [property: GraphQLName("pageSize")] int PageSize,
    [property: GraphQLName("items")] List<WeatherReadingItem> Items
);

// DTO representing the state stored in Dapr
public record TelemetryPayloadDto(
    [property: System.Text.Json.Serialization.JsonPropertyName("sensor_bp")] double SensorBp,
    [property: System.Text.Json.Serialization.JsonPropertyName("sensor_h")] double SensorH,
    [property: System.Text.Json.Serialization.JsonPropertyName("sensor_t")] double SensorT,
    [property: System.Text.Json.Serialization.JsonPropertyName("time")] long Time,
    [property: System.Text.Json.Serialization.JsonPropertyName("id")] string? Id = null,
    [property: System.Text.Json.Serialization.JsonPropertyName("lat")] double Lat = 0,
    [property: System.Text.Json.Serialization.JsonPropertyName("long")] double Long = 0,
    [property: System.Text.Json.Serialization.JsonPropertyName("pm1_0")] double Pm1_0 = 0,
    [property: System.Text.Json.Serialization.JsonPropertyName("pm2_5")] double Pm2_5 = 0,
    [property: System.Text.Json.Serialization.JsonPropertyName("pm10_0")] double Pm10_0 = 0
);
