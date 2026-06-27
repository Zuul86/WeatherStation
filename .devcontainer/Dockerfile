FROM mcr.microsoft.com/devcontainers/dotnet:10.0-noble

# Fix Yarn repository GPG key / signature issue on Ubuntu noble
RUN rm -f /etc/apt/sources.list.d/yarn.list

# Configure nftables backend for iptables when the base image provides the needed alternatives.
RUN if [ -x /usr/sbin/iptables-nft ] && update-alternatives --list iptables >/dev/null 2>&1; then \
      update-alternatives --set iptables /usr/sbin/iptables-nft; \
    fi; \
    if [ -x /usr/sbin/ip6tables-nft ] && update-alternatives --list ip6tables >/dev/null 2>&1; then \
      update-alternatives --set ip6tables /usr/sbin/ip6tables-nft; \
    fi

