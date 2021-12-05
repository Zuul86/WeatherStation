#include <Arduino.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <ESP8266WiFi.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include "DHT.h"
#include <SFE_BMP180.h>
#include <Wire.h>

#include "secrets.h"

WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org");

WiFiClientSecure net = WiFiClientSecure();
PubSubClient client(net);

PrivateKey pk(AWS_CERT_PRIVATE);
X509List mycert(AWS_CERT_CRT);
X509List x509(AWS_CERT_CA);

DHT dht(DHT_PIN, DHT22);
SFE_BMP180 pressure;

void connectWiFi()
{
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to Wi-Fi");

  while (WiFi.status() != WL_CONNECTED){
    delay(500);
    Serial.print(".");
  }

  Serial.println(WiFi.localIP());
}

void configurePubSubClient()
{
  timeClient.begin();
  while(!timeClient.update())
  {
    timeClient.forceUpdate();
  }

  net.setX509Time(timeClient.getEpochTime());
  net.setClientRSACert(&mycert, &pk);
  net.setTrustAnchors(&x509);

  client.setServer(AWS_IOT_ENDPOINT, AWS_PORT);
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
  float tempurature = dht.readTemperature();

  doc["id"] = String(ESP.getChipId());
  doc["time"] = timeClient.getEpochTime();
  doc["sensor_h"] = dht.readHumidity();
  doc["sensor_t"] = tempurature;
  doc["sensor_bp"] = getPressure(tempurature);
  doc["lat"] = LAT;
  doc["long"] = LONG;

  char jsonBuffer[512];
  serializeJson(doc, jsonBuffer);

  client.publish(AWS_IOT_PUBLISH_TOPIC, jsonBuffer);
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (client.connect(THINGNAME)) {
      Serial.println("AWS IoT Connected!");
    } else {
      Serial.print("failed, try again in 5 seconds");

      char buf[256];
      net.getLastSSLError(buf,256);
      Serial.println("WiFiClientSecure SSL error: ");
      Serial.println(buf);

      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(9600);
  dht.begin();
  Wire.begin(SDA_PIN,SCL_PIN);
  pressure.begin();
  connectWiFi();
  configurePubSubClient();
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }

  client.loop();
  publishWeatherData();
  delay(DATA_COLLECTION_INTERVAL);
}