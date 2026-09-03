#include <Arduino.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <ESP8266WiFi.h>
#include <SoftwareSerial.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include "DHT.h"
#include <SFE_BMP180.h>
#include <Wire.h>
#include <WiFiManager.h> 
#include <PubSubClient.h>

#include "secrets.h"
#include "PMSIntervalSampler.h"

#ifndef MQTT_TELEMETRY_TOPIC
#define MQTT_TELEMETRY_TOPIC "weather/telemetry"
#endif

#ifndef PIN_PMS_RX
#define PIN_PMS_RX 12
#endif
#ifndef PIN_PMS_TX
#define PIN_PMS_TX 13
#endif
#ifndef PIN_PMS_SET
#define PIN_PMS_SET 15
#endif
#ifndef PMS_WARMUP_MS
#define PMS_WARMUP_MS 30000
#endif

WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org");

DHT dht(DHT_PIN, DHT22);
SFE_BMP180 pressure;

// PMS5003 SoftwareSerial and Interval Sampler
SoftwareSerial pmsSerial(PIN_PMS_RX, PIN_PMS_TX);
PMSIntervalSampler<SoftwareSerial> sampler(pmsSerial, PIN_PMS_SET, DATA_COLLECTION_INTERVAL, PMS_WARMUP_MS);

WiFiClient espClient; // Use standard WiFiClient for dev / non-TLS
WiFiClientSecure espClientSecure; // Use WiFiClientSecure for TLS (Port 8883)
PubSubClient mqttClient;

unsigned long lastMqttReconnectAttempt = 0;

bool ensureMqttConnected() {
  if (mqttClient.connected()) {
    return true;
  }
  unsigned long now = millis();
  if (now - lastMqttReconnectAttempt > 5000) {
    lastMqttReconnectAttempt = now;
    Serial.print(F("Attempting MQTT connection..."));
    if (mqttClient.connect(MQTT_CLIENT_ID, MQTT_USER, MQTT_PASSWORD)) {
      Serial.println(F(" connected to MQTT broker"));
      return true;
    } else {
      Serial.print(F(" failed, rc="));
      Serial.println(mqttClient.state());
    }
  }
  return false;
}

double getPressure(double temperature)
{
  double P;
  delay(pressure.startPressure(3));
  delay(pressure.getPressure(P, temperature));
  return(pressure.sealevel(P, ALTITUDE_METERS));
}

void publishWeatherData(const PMS::DATA* pmsReport = nullptr)
{
  StaticJsonDocument<512> doc;

  long time = timeClient.getEpochTime();

  // Retry DHT22 read up to 3 times to mitigate microsecond timing glitches
  float temperature = NAN;
  float humidity = NAN;
  for (int attempt = 0; attempt < 3; attempt++) {
    temperature = dht.readTemperature();
    humidity = dht.readHumidity();
    if (!isnan(temperature) && !isnan(humidity)) {
      break;
    }
    delay(250);
  }

  bool dhtValid = !isnan(temperature) && !isnan(humidity);
  if (!dhtValid) {
    Serial.println(F("[DHT22] Warning: Failed to read DHT22 sensor after 3 attempts."));
  }

  // BMP180 pressure calculation requires temperature; use DHT or fallback 20.0C
  double tempForPressure = dhtValid ? temperature : 20.0;
  double pressureVal = getPressure(tempForPressure);

  doc["id"] = String(ESP.getChipId());
  doc["time"] = time;
  doc["sensor_h"] = dhtValid ? humidity : 0.0;
  doc["sensor_t"] = dhtValid ? temperature : 0.0;
  doc["sensor_bp"] = pressureVal;
  doc["lat"] = LAT;
  doc["long"] = LONG;

  doc["pm1_0"] = (pmsReport != nullptr) ? pmsReport->PM_AE_UG_1_0 : 0;
  doc["pm2_5"] = (pmsReport != nullptr) ? pmsReport->PM_AE_UG_2_5 : 0;
  doc["pm10_0"] = (pmsReport != nullptr) ? pmsReport->PM_AE_UG_10_0 : 0;

  char jsonBuffer[512];
  serializeJson(doc, jsonBuffer);
  
  Serial.print(F("Publishing telemetry to "));
  Serial.print(MQTT_TELEMETRY_TOPIC);
  Serial.print(F(": "));
  Serial.println(jsonBuffer);
  
  mqttClient.publish(MQTT_TELEMETRY_TOPIC, jsonBuffer);
}

WiFiManager wifiManager;

void setup() {
  Serial.begin(9600);
  while (!Serial && millis() < 2000);

  Serial.print(F("I'm Alive! Chip ID: "));
  Serial.println(ESP.getChipId());

  dht.begin();
  Wire.begin(SDA_PIN, SCL_PIN);
  pressure.begin();
  
  WiFi.disconnect(true);
  delay(2000);
  
  // Connect via WiFiManager
  wifiManager.autoConnect("WEATHER-STATION");

  // Setup time synchronization (Required for TLS handshake / IoT Hub validation)
  timeClient.begin();
  Serial.print(F("Synchronizing time via NTP..."));
  int attempts = 0;
  while (!timeClient.update() && attempts < 10) {
    timeClient.forceUpdate();
    delay(500);
    attempts++;
    Serial.print(F("."));
  }
  Serial.println(F(" done!"));
  
  // Set up MQTT client connection security
  if (MQTT_PORT == 8883) {
    // If TLS port is used, configure WiFiClientSecure
    #ifdef MQTT_SSL_FINGERPRINT
    if (String(MQTT_SSL_FINGERPRINT) != "XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX") {
      espClientSecure.setFingerprint(MQTT_SSL_FINGERPRINT);
    } else {
      espClientSecure.setInsecure();
    }
    #else
    espClientSecure.setInsecure();
    #endif
    mqttClient.setClient(espClientSecure);
  } else {
    mqttClient.setClient(espClient);
  }
  
  // Allocate buffer size for Azure IoT Hub SAS tokens & longer topics
  mqttClient.setBufferSize(512);
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);

  // Initialize PMS Interval Sampler
  Serial.println(F("[App] Initializing PMS5003 Interval Sampler..."));
  sampler.begin(PIN_PMS_RX, PIN_PMS_TX);
}

void loop() {
  // Ensure MQTT connection without blocking
  ensureMqttConnected();
  if (mqttClient.connected()) {
    mqttClient.loop();
  }

  // Non-blocking tick; returns true when fresh, verified sample is captured
  if (sampler.update()) {
    const PMS::DATA& report = sampler.getData();

    Serial.println(F("\n--- Particulate Matter Report ---"));
    Serial.printf("PM1.0 (Atmospheric): %u ug/m3\n", report.PM_AE_UG_1_0);
    Serial.printf("PM2.5 (Atmospheric): %u ug/m3\n", report.PM_AE_UG_2_5);
    Serial.printf("PM10  (Atmospheric): %u ug/m3\n", report.PM_AE_UG_10_0);
    Serial.println(F("---------------------------------"));

    timeClient.update();
    publishWeatherData(&report);
  } else if (sampler.didTimeout()) {
    Serial.println(F("[PMS] Acquisition timeout: sensor put back to sleep. Publishing weather data without PM..."));
    timeClient.update();
    publishWeatherData(nullptr);
  }

  // Other non-blocking tasks run concurrently here
}