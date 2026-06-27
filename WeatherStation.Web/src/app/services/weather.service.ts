import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { WeatherReading } from '../models/weather-reading.model';

interface WeatherReadingRaw {
  id?: number | string;
  timestamp?: string | Date;
  temperatureFahrenheit?: number | string;
  temperature?: number | string;
  humidity?: number | string;
  pressure?: number | string;
  deviceId?: string | null;
}

interface GetWeatherReadingsResult {
  weatherReadings: WeatherReadingRaw[];
}

interface GetLatestReadingsResult {
  latestReadings: WeatherReadingRaw[];
}

interface GetWeatherReadingResult {
  weatherReading: WeatherReadingRaw | null;
}

@Injectable({ providedIn: 'root' })
export class WeatherService {
  constructor(private apollo: Apollo) {}

  private normalize(obj: WeatherReadingRaw | null): WeatherReading | null {
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
    };
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
  getWeatherReadings(filter?: Record<string, unknown>, sort?: Record<string, unknown>): Observable<WeatherReading[]> {
    return this.apollo
      .watchQuery<GetWeatherReadingsResult>({
        query: this.GET_WEATHER_READINGS,
        variables: { filter: filter ?? null, sort: sort ?? null },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(
        map((r) =>
          (r.data?.weatherReadings ?? [])
            .map((item) => this.normalize(item as WeatherReadingRaw))
            .filter((reading): reading is WeatherReading => reading !== null),
        ),
      );
  }

  /** Query the latest `count` readings (most recent first) */
  getLatestReadings(count: number): Observable<WeatherReading[]> {
    return this.apollo
      .watchQuery<GetLatestReadingsResult>({
        query: this.GET_LATEST_READINGS,
        variables: { count },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(
        map((r) =>
          (r.data?.latestReadings ?? [])
            .map((item) => this.normalize(item as WeatherReadingRaw))
            .filter((reading): reading is WeatherReading => reading !== null),
        ),
      );
  }

  /** Query a single reading by its ID */
  getWeatherReading(id: number): Observable<WeatherReading | null> {
    return this.apollo
      .watchQuery<GetWeatherReadingResult>({
        query: this.GET_WEATHER_READING,
        variables: { id },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((r) => this.normalize(r.data?.weatherReading as WeatherReadingRaw | null ?? null)));
  }
}
