FROM mcr.microsoft.com/devcontainers/dotnet:10.0-noble

# Fix Yarn repository GPG key / signature issue on Ubuntu noble
RUN rm -f /etc/apt/sources.list.d/yarn.list
