using Azure.Data.Tables;
using HotChocolate;

namespace WeatherStation.Api;

public class Query
{
    [GraphQLName("listWeatherData")]
    public async Task<WeatherDataResult> GetListWeatherData(
        [Service] TableServiceClient tableServiceClient,
        int limit = 1000)
    {
        var tableClient = tableServiceClient.GetTableClient("weatherdata");
        await tableClient.CreateIfNotExistsAsync();

        var items = new List<WeatherDataItem>();

        // Query entities from the Telemetry partition
        var queryResults = tableClient.QueryAsync<TableEntity>(filter: "PartitionKey eq 'Telemetry'");

        int count = 0;
        await foreach (var entity in queryResults)
        {
            if (count >= limit) break;

            double temp = entity.GetDouble("Temperature") ?? 0.0;
            double humid = entity.GetDouble("Humidity") ?? 0.0;
            double bp = entity.GetDouble("BarometricPressure") ?? 0.0;
            long time = entity.GetInt64("EpochTime") ?? 0;

            items.Add(new WeatherDataItem(bp, humid, temp, time));
            count++;
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
