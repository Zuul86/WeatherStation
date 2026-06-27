FROM mcr.microsoft.com/devcontainers/dotnet:10.0-noble

# Fix Yarn repository GPG key / signature issue on Ubuntu noble
RUN rm -f /etc/apt/sources.list.d/yarn.list

# Use nftables backend for iptables to allow Docker daemon to initialize successfully
RUN update-alternatives --set iptables /usr/sbin/iptables-nft \
 && update-alternatives --set ip6tables /usr/sbin/ip6tables-nft

