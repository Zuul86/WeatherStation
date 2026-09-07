export interface WeatherReading {
  id: number;
  timestamp: string;
  temperatureFahrenheit: number;
  humidity: number;
  pressure: number;
  deviceId: string | null;
  pm1_0: number;
  pm2_5: number;
  pm10_0: number;
}