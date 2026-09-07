#!/bin/sh
set -e

# Inject runtime configuration from environment variables
# Resolve from API_URL, API_HTTP, or Aspire service discovery variables
TARGET_URL="${API_URL:-${API_HTTP:-${services__api__https__0:-$services__api__http__0}}}"

if [ -n "$TARGET_URL" ]; then
    # Append /graphql if not already present
    case "$TARGET_URL" in
        */graphql) GRAPHQL_URL="$TARGET_URL" ;;
        *) GRAPHQL_URL="${TARGET_URL%/}/graphql" ;;
    esac

    echo "Injecting apiUrl=$GRAPHQL_URL into config.json"
    cat > /usr/share/nginx/html/assets/config.json <<EOF
{
  "apiUrl": "$GRAPHQL_URL"
}
EOF
fi

# Start nginx
exec nginx -g 'daemon off;'
