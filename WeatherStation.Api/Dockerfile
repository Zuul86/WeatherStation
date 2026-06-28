# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project files for restore
COPY WeatherStation.Api/WeatherStation.Api.csproj WeatherStation.Api/
COPY WeatherStation.ServiceDefaults/WeatherStation.ServiceDefaults.csproj WeatherStation.ServiceDefaults/
RUN dotnet restore WeatherStation.Api/WeatherStation.Api.csproj

# Copy source and publish
COPY WeatherStation.Api/ WeatherStation.Api/
COPY WeatherStation.ServiceDefaults/ WeatherStation.ServiceDefaults/
RUN dotnet publish WeatherStation.Api/WeatherStation.Api.csproj -c Release -o /app/publish --no-restore

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

ENTRYPOINT ["dotnet", "WeatherStation.Api.dll"]
