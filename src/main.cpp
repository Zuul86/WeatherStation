#include <Arduino.h>
#include "secrets.h"
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <ESP8266WiFi.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include "DHT.h"

// Digital pin connected to the DHT sensor
#define DHTPIN 14     
// The MQTT topics that this device should publish/subscribe
#define AWS_IOT_PUBLISH_TOPIC   "weatherData/pub"
#define AWS_IOT_SUBSCRIBE_TOPIC "weatherData/sub"

WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org");

WiFiClientSecure net = WiFiClientSecure();
PubSubClient client(net);

BearSSL::PrivateKey pk(AWS_CERT_PRIVATE);
BearSSL::X509List mycert(AWS_CERT_CRT);
BearSSL::X509List x509(AWS_CERT_CA);

DHT dht(DHTPIN, DHT22);

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
  void callback(char* topic, byte* payload, unsigned int length);

  timeClient.begin();
  while(!timeClient.update())
  {
    timeClient.forceUpdate();
  }

  net.setX509Time(timeClient.getEpochTime());

  net.setClientRSACert(&mycert, &pk);
  net.setTrustAnchors(&x509);

  // Connect to the MQTT broker on the AWS endpoint we defined earlier
  client.setServer(AWS_IOT_ENDPOINT, 8883);

  // Create a message handler
  client.setCallback(callback);
}

void publishMessage()
{
  StaticJsonDocument<200> doc;
  doc["time"] = timeClient.getEpochTime();
  doc["sensor_h"] = dht.readHumidity();
  doc["sensor_t"] = dht.readTemperature();
  char jsonBuffer[512];
  serializeJson(doc, jsonBuffer); // print to client
  client.publish(AWS_IOT_PUBLISH_TOPIC, jsonBuffer);
}

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  for (unsigned int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (client.connect(THINGNAME)) {
      Serial.println("AWS IoT Connected!");
      client.subscribe(AWS_IOT_SUBSCRIBE_TOPIC);
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