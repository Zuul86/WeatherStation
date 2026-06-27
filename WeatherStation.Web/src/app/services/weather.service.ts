import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { WeatherReading } from '../models/weather-reading.model';

@Injectable({ providedIn: 'root' })
export class WeatherService {
  constructor(private apollo: Apollo) {}

  private normalize(obj: any): WeatherReading | null {
    if (!obj) return null;
    const id = typeof obj.id === 'number' ? obj.id : Number(obj.id);
    if (Number.isNaN(id)) return null;
    return {
      id,
      timestamp: String(obj.timestamp),
      temperatureFahrenheit: Number(obj.temperatureFahrenheit ?? obj.temperature ?? 0),
      humidity: Number(obj.humidity ?? 0),
      pressure: Number(obj.pressure ?? 0),
      deviceId: obj.deviceId ?? null,
    } as WeatherReading;
  }

  private GET_WEATHER_READINGS = gql`
    query GetWeatherReadings($filter: JSON, $sort: JSON) {
      weatherReadings(filter: $filter, sort: $sort) {
        id
        timestamp
        temperatureFahrenheit
        humidity
        pressure
        deviceId
      }
    }
  `;

  private GET_LATEST_READINGS = gql`
    query GetLatestReadings($count: Int!) {
      latestReadings(count: $count) {
        id
        timestamp
        temperatureFahrenheit
        humidity
        pressure
        deviceId
      }
    }
  `;

  private GET_WEATHER_READING = gql`
    query GetWeatherReading($id: Int!) {
      weatherReading(id: $id) {
        id
        timestamp
        temperatureFahrenheit
        humidity
        pressure
        deviceId
      }
    }
  `;

  /**
   * Query all weather readings. Accepts optional filter and sort objects
   * which will be passed as GraphQL variables.
   */
  getWeatherReadings(filter?: any, sort?: any): Observable<WeatherReading[]> {
    return this.apollo
      .watchQuery<{ weatherReadings: WeatherReading[] }>({
        query: this.GET_WEATHER_READINGS,
        variables: { filter: filter ?? null, sort: sort ?? null },
        fetchPolicy: 'network-only',
      })
          .valueChanges.pipe(map((r) => (r.data?.weatherReadings ?? []).map((x: any) => this.normalize(x)).filter((x): x is WeatherReading => x !== null)));
  }

  /** Query the latest `count` readings (most recent first) */
  getLatestReadings(count: number): Observable<WeatherReading[]> {
    return this.apollo
      .watchQuery<{ latestReadings: WeatherReading[] }>({
        query: this.GET_LATEST_READINGS,
        variables: { count },
        fetchPolicy: 'network-only',
      })
          .valueChanges.pipe(map((r) => (r.data?.latestReadings ?? []).map((x: any) => this.normalize(x)).filter((x): x is WeatherReading => x !== null)));
  }

  /** Query a single reading by its ID */
  getWeatherReading(id: number): Observable<WeatherReading | null> {
    return this.apollo
      .watchQuery<{ weatherReading: WeatherReading | null }>({
        query: this.GET_WEATHER_READING,
        variables: { id },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((r) => this.normalize(r.data?.weatherReading ?? null)));
  }
}
