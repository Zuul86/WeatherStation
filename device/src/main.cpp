#include <Arduino.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <ESP8266WiFi.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include "DHT.h"
#include <SFE_BMP180.h>
#include <Wire.h>
#include <WiFiManager.h> 
#include <PubSubClient.h>

#include "secrets.h"

WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org");

DHT dht(DHT_PIN, DHT22);
SFE_BMP180 pressure;

WiFiClient espClient; // Use standard WiFiClient for dev / non-TLS
WiFiClientSecure espClientSecure; // Use WiFiClientSecure for TLS (Port 8883)
PubSubClient mqttClient;

unsigned long lastMsg = 0;

void reconnect() {
  while (!mqttClient.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    // Attempt to connect
    if (mqttClient.connect(MQTT_CLIENT_ID, MQTT_USER, MQTT_PASSWORD)) {
      Serial.println("connected to MQTT broker");
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

double getPressure(double temperature)
{
  double P;
  delay(pressure.startPressure(3));
  delay(pressure.getPressure(P,temperature));
  return(pressure.sealevel(P, ALTITUDE_METERS));
}

void publishWeatherData()
{
  StaticJsonDocument<200> doc;

  long time = timeClient.getEpochTime();
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  if(!isnan(temperature))
  {
    double pressureVal = getPressure(temperature);

    doc["id"] = String(ESP.getChipId());
    doc["time"] = time;
    doc["sensor_h"] = humidity;
    doc["sensor_t"] = temperature;
    doc["sensor_bp"] = pressureVal;
    doc["lat"] = LAT;
    doc["long"] = LONG;

    char jsonBuffer[512];
    serializeJson(doc, jsonBuffer);
    
    Serial.print("Publishing telemetry: ");
    Serial.println(jsonBuffer);
    
    mqttClient.publish("weather/telemetry", jsonBuffer);
  } 
  else
  {
    Serial.println("error reading DHT22 sensor");
  }
}

WiFiManager wifiManager;

void setup() {
  Serial.begin(9600);
  dht.begin();
  Wire.begin(SDA_PIN, SCL_PIN);
  pressure.begin();
  
  WiFi.disconnect(true);
  delay(2000);
  
  // Connect via WiFiManager
  wifiManager.autoConnect("ZOMBIE");

  // Setup time synchronization
  timeClient.begin();
  
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
  
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
}

void loop() {
  if (!mqttClient.connected()) {
    reconnect();
  }
  mqttClient.loop();

  unsigned long now = millis();
  if (now - lastMsg > DATA_COLLECTION_INTERVAL) {
    lastMsg = now;
    timeClient.update();
    publishWeatherData();
  }
}