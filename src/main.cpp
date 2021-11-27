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

BearSSL::PrivateKey pk(AWS_CERT_PRIVATE);
BearSSL::X509List mycert(AWS_CERT_CRT);
BearSSL::X509List x509(AWS_CERT_CA);

DHT dht(DHTPIN, DHT22);
SFE_BMP180 pressure;

void connectWiFi()
{
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.println("Connecting to Wi-Fi");

  while (WiFi.status() != WL_CONNECTED){
    delay(500);
    Serial.print(".");
  }

  Serial.println(WiFi.localIP());
}

void connectAWS()
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
  return(pressure.sealevel(P, 265.00));
}

void publishMessage()
{
  StaticJsonDocument<200> doc;
  doc["time"] = timeClient.getEpochTime();
  doc["sensor_h"] = dht.readHumidity();
  float tempurature = dht.readTemperature();
  doc["sensor_t"] = tempurature;
  doc["sensor_bp"] = getPressure(tempurature);
  char jsonBuffer[512];
  serializeJson(doc, jsonBuffer); // print to client
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
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      char buf[256];
      net.getLastSSLError(buf,256);
      Serial.println("WiFiClientSecure SSL error: ");
      Serial.println(buf);
      delay(20000);
    }
  }
}

void setup() {
  Serial.begin(9600);
  dht.begin();
  Wire.begin(13,12);

  if (pressure.begin()){
    Serial.println("BMP180 init success");
  }
  connectWiFi();
  connectAWS();
}

void loop() {
  
  if (!client.connected()) {
    reconnect();
  }

  client.loop();
  publishMessage();
  delay(30000);
}