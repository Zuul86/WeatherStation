export interface WeatherReading {
  id: number;
  timestamp: string;
  temperatureFahrenheit: number;
  humidity: number;
  pressure: number;
  deviceId: string | null;
}