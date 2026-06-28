#!/bin/sh
set -e

# Inject runtime configuration from environment variables
if [ -n "$API_URL" ]; then
    echo "Injecting API_URL=$API_URL into config.json"
    cat > /usr/share/nginx/html/assets/config.json <<EOF
{
  "apiUrl": "$API_URL"
}
EOF
fi

# Start nginx
exec nginx -g 'daemon off;'
