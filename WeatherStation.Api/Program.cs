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

// Enable CORS for frontend integration
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors();

app.MapDefaultEndpoints();

// Map the HotChocolate GraphQL endpoint at /graphql
app.MapGraphQL();

app.Run();
