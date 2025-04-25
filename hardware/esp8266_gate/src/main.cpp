#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ArduinoJson.h>

const char* ssid = "ssid";
const char* password = "password";
const char* mqtt_server = "192.168.1.124";
const char* mqtt_username = "leonid";
const char* mqtt_password = "2006";
const char* mqtt_topic_pass_id = "esp8266/pass_id";
const char* mqtt_topic_gate_control = "esp8266/gate_control";

#define RST_PIN D0
#define SS_PIN D8
#define RELAY_PIN D4

WiFiClient espClient;
PubSubClient client(espClient);
MFRC522 mfrc522(SS_PIN, RST_PIN);

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");

  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println(message);

  if (String(topic) == mqtt_topic_gate_control) {
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, message);

    if (error) {
      Serial.print("Failed to parse JSON: ");
      Serial.println(error.c_str());
      return;
    }

    String pass_id = doc["pass_id"];
    bool access_granted = doc["access_granted"];

    Serial.print("Pass ID: ");
    Serial.println(pass_id);
    Serial.print("Access Granted: ");
    Serial.println(access_granted ? "true" : "false");

    if (access_granted) {
      digitalWrite(RELAY_PIN, LOW); 
      delay(1000);
      digitalWrite(RELAY_PIN, HIGH); 
      Serial.println("Relay ON");
    } else {
      digitalWrite(RELAY_PIN, HIGH); 
      Serial.println("Relay OFF");
    }
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "ESP8266Client-" + String(ESP.getChipId());
    if (client.connect(clientId.c_str(), mqtt_username, mqtt_password)) {
      Serial.println("connected");
      client.subscribe(mqtt_topic_gate_control);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  SPI.begin();
  mfrc522.PCD_Init();
  pinMode(RELAY_PIN, OUTPUT); 
  digitalWrite(RELAY_PIN, HIGH); 
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
  client.setKeepAlive(60); 
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    String uid = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
      uid += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
      uid += String(mfrc522.uid.uidByte[i], HEX);
    }
    Serial.println("Card UID: " + uid);
    if (client.publish(mqtt_topic_pass_id, uid.c_str())) {
      Serial.println("UID sent to MQTT");
    } else {
      Serial.println("Failed to send UID to MQTT");
    }

    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
  }
}