using WeatherStation.Api;

var builder = WebApplication.CreateBuilder(args);

// Add service defaults and OpenTelemetry
builder.AddServiceDefaults();

// Add Dapr Client
builder.Services.AddDaprClient();

// Configure GraphQL Server using HotChocolate
builder.Services
    .AddGraphQLServer()
    .AddQueryType<Query>();

// CORS — configurable per environment
var allowedOrigins = builder.Configuration["AllowedCorsOrigins"];
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (!string.IsNullOrEmpty(allowedOrigins))
        {
            policy.WithOrigins(allowedOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
        else
        {
            // Permissive CORS for local development only
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
    });
});

var app = builder.Build();

app.UseCors();

app.MapDefaultEndpoints();

// Map the HotChocolate GraphQL endpoint at /graphql
app.MapGraphQL();

app.Run();
