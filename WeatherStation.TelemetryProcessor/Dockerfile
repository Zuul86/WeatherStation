# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project files for restore
COPY WeatherStation.TelemetryProcessor/WeatherStation.TelemetryProcessor.csproj WeatherStation.TelemetryProcessor/
COPY WeatherStation.ServiceDefaults/WeatherStation.ServiceDefaults.csproj WeatherStation.ServiceDefaults/
RUN dotnet restore WeatherStation.TelemetryProcessor/WeatherStation.TelemetryProcessor.csproj

# Copy source and publish
COPY WeatherStation.TelemetryProcessor/ WeatherStation.TelemetryProcessor/
COPY WeatherStation.ServiceDefaults/ WeatherStation.ServiceDefaults/
RUN dotnet publish WeatherStation.TelemetryProcessor/WeatherStation.TelemetryProcessor.csproj -c Release -o /app/publish --no-restore

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

ENTRYPOINT ["dotnet", "WeatherStation.TelemetryProcessor.dll"]
