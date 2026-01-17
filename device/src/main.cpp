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

#include "secrets.h"

WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org");

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
    double pressure = getPressure(temperature);

    doc["id"] = String(ESP.getChipId());
    doc["time"] = time;
    doc["sensor_h"] = humidity;
    doc["sensor_t"] = temperature;
    doc["sensor_bp"] = pressure;
    doc["lat"] = LAT;
    doc["long"] = LONG;
  } 
  else
  {
    Serial.println("error reading DHT22 sensor");
  }

  char jsonBuffer[512];
  serializeJson(doc, jsonBuffer);
}

WiFiManager wifiManager;

void setup() {
  Serial.begin(9600);
  dht.begin();
  Wire.begin(SDA_PIN,SCL_PIN);
  pressure.begin();
  //connectWiFi();
  WiFi.disconnect(true);
  delay(10000);
  wifiManager.autoConnect("ZOMBIE");

}

void loop() {
  publishWeatherData();
  delay(DATA_COLLECTION_INTERVAL);
}