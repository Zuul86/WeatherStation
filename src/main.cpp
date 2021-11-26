#include <Arduino.h>
#include "secrets.h"
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <ESP8266WiFi.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include "DHT.h"
#include <SFE_BMP180.h>
#include <Wire.h>

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

double getPressure()
{
  char status;
  double T,P,p0,a;

  // You must first get a temperature measurement to perform a pressure reading.
  
  // Start a temperature measurement:
  // If request is successful, the number of ms to wait is returned.
  // If request is unsuccessful, 0 is returned.

  status = pressure.startTemperature();
  if (status != 0)
  {
    // Wait for the measurement to complete:

    delay(status);

    // Retrieve the completed temperature measurement:
    // Note that the measurement is stored in the variable T.
    // Use '&T' to provide the address of T to the function.
    // Function returns 1 if successful, 0 if failure.

    status = pressure.getTemperature(T);
    if (status != 0)
    {
      // Start a pressure measurement:
      // The parameter is the oversampling setting, from 0 to 3 (highest res, longest wait).
      // If request is successful, the number of ms to wait is returned.
      // If request is unsuccessful, 0 is returned.

      status = pressure.startPressure(3);
      if (status != 0)
      {
        // Wait for the measurement to complete:
        delay(status);

        // Retrieve the completed pressure measurement:
        // Note that the measurement is stored in the variable P.
        // Use '&P' to provide the address of P.
        // Note also that the function requires the previous temperature measurement (T).
        // (If temperature is stable, you can do one temperature measurement for a number of pressure measurements.)
        // Function returns 1 if successful, 0 if failure.

        status = pressure.getPressure(P,T);
        if (status != 0)
        {
          delay(status);
          p0 = pressure.sealevel(P, 265.00);
          return(p0);
        }
        else 
        {
          Serial.println("error retrieving pressure measurement\n");
          return 1;
        }
      }
      else 
      {
        Serial.println("error starting pressure measurement\n");
        return 1;
      }
    }
    else 
    {
      Serial.println("error retrieving temperature measurement\n");
      return 1;
    }
  }
  else 
  {
    Serial.println("error starting temperature measurement\n");
    return 1;
  }
}

void publishMessage()
{
  StaticJsonDocument<200> doc;
  doc["time"] = timeClient.getEpochTime();
  doc["sensor_h"] = dht.readHumidity();
  doc["sensor_t"] = dht.readTemperature();
  doc["sensor_bp"] = getPressure();
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