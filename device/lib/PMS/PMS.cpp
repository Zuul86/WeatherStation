#include <Arduino.h>
#include "PMS.h"

PMS::PMS(Stream& stream)
{
  this->_stream = &stream;
}

// Standby mode. Shut down laser and fan.
void PMS::sleep()
{
  uint8_t command[] = { 0x42, 0x4D, 0xE4, 0x00, 0x00, 0x01, 0x73 };
  _stream->write(command, sizeof(command));
}

// Operating mode. Fan purges dust and reaches steady RPM.
void PMS::wakeUp()
{
  uint8_t command[] = { 0x42, 0x4D, 0xE4, 0x00, 0x01, 0x01, 0x74 };
  _stream->write(command, sizeof(command));
}

// Active mode. Continuous auto-reporting.
void PMS::activeMode()
{
  uint8_t command[] = { 0x42, 0x4D, 0xE1, 0x00, 0x01, 0x01, 0x71 };
  _stream->write(command, sizeof(command));
  _mode = MODE_ACTIVE;
}

// Passive mode. Report data only upon request.
void PMS::passiveMode()
{
  uint8_t command[] = { 0x42, 0x4D, 0xE1, 0x00, 0x00, 0x01, 0x70 };
  _stream->write(command, sizeof(command));
  _mode = MODE_PASSIVE;
}

// Request read in Passive Mode.
void PMS::requestRead()
{
  if (_mode == MODE_PASSIVE)
  {
    uint8_t command[] = { 0x42, 0x4D, 0xE2, 0x00, 0x00, 0x01, 0x71 };
    _stream->write(command, sizeof(command));
  }
}

// Non-blocking parse response.
bool PMS::read(DATA& data)
{
  _data = &data;
  loop();
  
  return _status == STATUS_OK;
}

// Blocking parse response with timeout.
bool PMS::readUntil(DATA& data, uint16_t timeout)
{
  _data = &data;
  uint32_t start = millis();
  do
  {
    loop();
    if (_status == STATUS_OK) break;
    yield();
  } while (millis() - start < timeout);

  return _status == STATUS_OK;
}

void PMS::loop()
{
  _status = STATUS_WAITING;
  while (_stream->available())
  {
    uint8_t ch = _stream->read();
    _totalBytesRead++;

    switch (_index)
    {
    case 0:
      if (ch != 0x42)
      {
        return;
      }
      _calculatedChecksum = ch;
      break;

    case 1:
      if (ch != 0x4D)
      {
        _index = 0;
        return;
      }
      _calculatedChecksum += ch;
      break;

    case 2:
      _calculatedChecksum += ch;
      _frameLen = ch << 8;
      break;

    case 3:
      _frameLen |= ch;
      // Valid PMS frames: 2*9+2 (PMS1003) or 2*13+2 (PMS5003/7003)
      if (_frameLen != 2 * 9 + 2 && _frameLen != 2 * 13 + 2)
      {
        _index = 0;
        return;
      }
      _calculatedChecksum += ch;
      break;

    default:
      if (_index == _frameLen + 2)
      {
        _checksum = ch << 8;
      }
      else if (_index == _frameLen + 2 + 1)
      {
        _checksum |= ch;

        if (_calculatedChecksum == _checksum)
        {
          _status = STATUS_OK;
        }
        else
        {
          Serial.printf("[PMS] Checksum mismatch! Calc: 0x%04X, Sensor: 0x%04X\n", _calculatedChecksum, _checksum);
        }

        if (_status == STATUS_OK)
        {

          // Standard Particles, CF=1
          _data->PM_SP_UG_1_0 = makeWord(_payload[0], _payload[1]);
          _data->PM_SP_UG_2_5 = makeWord(_payload[2], _payload[3]);
          _data->PM_SP_UG_10_0 = makeWord(_payload[4], _payload[5]);

          // Atmospheric Environment
          _data->PM_AE_UG_1_0 = makeWord(_payload[6], _payload[7]);
          _data->PM_AE_UG_2_5 = makeWord(_payload[8], _payload[9]);
          _data->PM_AE_UG_10_0 = makeWord(_payload[10], _payload[11]);

          // Raw particle counts per 0.1L air (PMS5003 32-byte frame)
          if (_frameLen >= 2 * 13 + 2)
          {
            _data->PM_RAW_0_3 = makeWord(_payload[12], _payload[13]);
            _data->PM_RAW_0_5 = makeWord(_payload[14], _payload[15]);
            _data->PM_RAW_1_0 = makeWord(_payload[16], _payload[17]);
            _data->PM_RAW_2_5 = makeWord(_payload[18], _payload[19]);
            _data->PM_RAW_5_0 = makeWord(_payload[20], _payload[21]);
            _data->PM_RAW_10_0 = makeWord(_payload[22], _payload[23]);
          }
        }

        _index = 0;
        return;
      }
      else
      {
        _calculatedChecksum += ch;
        uint8_t payloadIndex = _index - 4;

        if (payloadIndex < sizeof(_payload))
        {
          _payload[payloadIndex] = ch;
        }
      }

      break;
    }

    _index++;
  }
}
