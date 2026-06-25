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
        var items = new List<WeatherDataItem>();

        try
        {
            // Query telemetry from Dapr state store
            var queryJson = $$"""
            {
                "page": {
                    "limit": {{limit}}
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
                        items.Add(new WeatherDataItem(payload.SensorBp, payload.SensorH, payload.SensorT, payload.Time));
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error querying Dapr state store: {ex}");
        }

        // Return newest readings first
        var sortedItems = items.OrderByDescending(x => x.Time).ToList();
        return new WeatherDataResult(sortedItems);
    }
}

public record WeatherDataResult(List<WeatherDataItem> Items);

public record WeatherDataItem(
    [property: GraphQLName("sensor_bp")] double SensorBp,
    [property: GraphQLName("sensor_h")] double SensorH,
    [property: GraphQLName("sensor_t")] double SensorT,
    [property: GraphQLName("time")] long Time
);

// DTO representing the state stored in Dapr
public record TelemetryPayloadDto(
    [property: System.Text.Json.Serialization.JsonPropertyName("sensor_bp")] double SensorBp,
    [property: System.Text.Json.Serialization.JsonPropertyName("sensor_h")] double SensorH,
    [property: System.Text.Json.Serialization.JsonPropertyName("sensor_t")] double SensorT,
    [property: System.Text.Json.Serialization.JsonPropertyName("time")] long Time
);
