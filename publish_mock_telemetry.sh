#!/bin/bash
# Script to publish mock weather telemetry to local MQTT broker using Docker

PAYLOAD='{
  "id": "123456",
  "time": '$(date +%s)',
  "sensor_h": 55.4,
  "sensor_t": 23.8,
  "sensor_bp": 1012.35,
  "lat": 37.7749,
  "long": -122.4194
}'

echo "Publishing payload: $PAYLOAD"

docker run --rm --network host eclipse-mosquitto mosquitto_pub \
  -h localhost \
  -t "weather/telemetry" \
  -u "dev_user" \
  -P "dev_password" \
  -m "$PAYLOAD"

echo "Done!"
