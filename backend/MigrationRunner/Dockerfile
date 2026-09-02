# Build stage - native platform to avoid Rosetta crashes on Apple Silicon
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

COPY . .
RUN dotnet publish MigrationRunner -c Release -o /out

# Runtime stage
FROM mcr.microsoft.com/dotnet/runtime:10.0
WORKDIR /app

COPY --from=build /out .

ENTRYPOINT ["dotnet", "MigrationRunner.dll"]