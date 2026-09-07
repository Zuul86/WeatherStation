#pragma once
#include <Arduino.h>
#include <PMS.h>
#include <type_traits>

#if defined(ESP8266)
#include <SoftwareSerial.h>
#endif

template <typename SerialType = Stream>
class PMSIntervalSampler {
public:
    enum State {
        STATE_SLEEP,
        STATE_WARMING_UP,
        STATE_ACQUIRING
    };

    PMSIntervalSampler(SerialType& port, int8_t setPin = -1, 
                       uint32_t intervalMs = 300000, 
                       uint32_t warmupMs = 30000)
        : _serial(port), _pms(port), _setPin(setPin), 
          _intervalMs(intervalMs), _warmupMs(warmupMs),
          _state(STATE_SLEEP), _stateTimer(0), _timedOut(false) {}

    void begin(int8_t rxPin = -1, int8_t txPin = -1) {
        if (_setPin >= 0) {
            pinMode(_setPin, OUTPUT);
            digitalWrite(_setPin, HIGH);
        }

        initSerial(rxPin, txPin);

        wake();
    }

    // Call regularly in loop(). Returns true once per interval when fresh data is ready.
    bool update() {
        uint32_t now = millis();
        _timedOut = false;

        switch (_state) {
            case STATE_SLEEP:
                if (now - _stateTimer >= (_intervalMs - _warmupMs)) {
                    wake();
                }
                break;

            case STATE_WARMING_UP:
                // Drain bytes so SoftwareSerial 64-byte FIFO buffer doesn't overflow during warm-up
                while (_serial.available()) {
                    _serial.read();
                    _warmupBytesSeen++;
                }

                if (now - _stateTimer >= _warmupMs) {
                    Serial.printf("[PMS] Warm-up complete. %lu bytes received from sensor during spin-up.\n", (unsigned long)_warmupBytesSeen);

                    // Flush old frames accumulated during fan spin-up
                    while (_serial.available()) {
                        _serial.read();
                    }

                    // Reset byte counter and enter acquisition for fresh frame
                    _pms.resetTotalBytesRead();
                    _state = STATE_ACQUIRING;
                    _stateTimer = millis();
                    Serial.println(F("[PMS] Waiting for fresh 32-byte data frame..."));
                }
                break;

            case STATE_ACQUIRING:
                if (_pms.readUntil(_lastData, 2500)) {
                    Serial.println(F("[PMS] Valid data frame received and verified!"));
                    sleep();
                    return true; 
                } else if (millis() - _stateTimer > 4000) {
                    // Acquisition timeout: sleep sensor and try again on next schedule
                    uint32_t acqBytes = _pms.getTotalBytesRead();
                    Serial.printf("[PMS] Acquisition timeout! (Warm-up bytes: %lu, Acquisition bytes: %lu)\n", 
                                  (unsigned long)_warmupBytesSeen, (unsigned long)acqBytes);
                    if (_warmupBytesSeen == 0 && acqBytes == 0) {
                        Serial.println(F("[PMS] ERROR: 0 bytes received on RX pin!"));
                        Serial.println(F("  1. Check RX/TX wiring: PMS5003 TXD must connect to ESP8266 RX (GPIO 12 / D6)."));
                        Serial.println(F("  2. If using SET pin, ensure SET is connected to 3.3V or GPIO 15 (D8). If unused, set PIN_PMS_SET to -1."));
                        Serial.println(F("  3. Check Power: PMS5003 requires 5V on VCC (from VIN / 5V pin) to spin fan & power laser."));
                    } else {
                        Serial.println(F("[PMS] Serial bytes detected, but no valid 32-byte frame could be parsed."));
                    }
                    sleep();
                    _timedOut = true;
                }
                break;
        }
        return false;
    }

    const PMS::DATA& getData() const {
        return _lastData;
    }

    State getState() const {
        return _state;
    }

    bool didTimeout() const {
        return _timedOut;
    }

    void setInterval(uint32_t intervalMs) {
        _intervalMs = intervalMs;
    }

private:
    void initSerial(int8_t rxPin, int8_t txPin) {
        if constexpr (std::is_same<SerialType, Stream>::value) {
            // Raw Stream has no begin() method; assume pre-initialized
            (void)rxPin;
            (void)txPin;
            return;
        } else {
#if defined(ESP8266)
            if constexpr (std::is_same<SerialType, SoftwareSerial>::value) {
                if (rxPin >= 0 && txPin >= 0) {
                    _serial.begin(9600, SWSERIAL_8N1, rxPin, txPin);
                } else {
                    _serial.begin(9600);
                }
            } else {
                _serial.begin(9600);
            }
#elif defined(ESP32)
            if constexpr (std::is_same<SerialType, HardwareSerial>::value) {
                if (rxPin >= 0 && txPin >= 0) {
                    _serial.begin(9600, SERIAL_8N1, rxPin, txPin);
                } else {
                    _serial.begin(9600);
                }
            } else {
                _serial.begin(9600);
            }
#else
            _serial.begin(9600);
#endif
        }
    }

    void wake() {
        _warmupBytesSeen = 0;
        if (_setPin >= 0) {
            pinMode(_setPin, OUTPUT);
            digitalWrite(_setPin, HIGH);
            delay(50); // Allow sensor power regulator to stabilize
        }
        _pms.wakeUp();
        delay(100);
        _pms.activeMode();
        _state = STATE_WARMING_UP;
        _stateTimer = millis();
        Serial.println(F("[PMS] Sensor woke up in active mode. Fan warm-up started (30s)..."));
    }

    void sleep() {
        Serial.println(F("[PMS] Putting sensor to sleep."));
        _pms.sleep();
        delay(50);
        if (_setPin >= 0) {
            digitalWrite(_setPin, LOW);
        }
        _state = STATE_SLEEP;
        _stateTimer = millis();
    }

    SerialType& _serial;
    PMS _pms;
    PMS::DATA _lastData;
    int8_t _setPin;
    uint32_t _intervalMs;
    uint32_t _warmupMs;
    State _state;
    uint32_t _stateTimer;
    bool _timedOut;
    uint32_t _warmupBytesSeen = 0;
};

// Deduction guide for constructor template argument deduction (CTAD)
template <typename SerialType>
PMSIntervalSampler(SerialType&, int8_t = -1, uint32_t = 300000, uint32_t = 30000) -> PMSIntervalSampler<SerialType>;
