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
  pm1_0?: number | string;
  pm2_5?: number | string;
  pm10_0?: number | string;
}

interface GetWeatherReadingsResult {
  weatherReadings: WeatherReadingRaw[];
}

interface GetLatestReadingsResult {
  latestReadings: WeatherReadingRaw[];
}

interface PaginatedReadingsResult {
  paginatedReadings: {
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    items: WeatherReadingRaw[];
  };
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
      pm1_0: Number(obj.pm1_0 ?? 0),
      pm2_5: Number(obj.pm2_5 ?? 0),
      pm10_0: Number(obj.pm10_0 ?? 0),
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
        pm1_0
        pm2_5
        pm10_0
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
        pm1_0
        pm2_5
        pm10_0
      }
    }
  `;

  private GET_PAGINATED_READINGS = gql`
    query GetPaginatedReadings($pageNumber: Int!, $pageSize: Int!) {
      paginatedReadings(pageNumber: $pageNumber, pageSize: $pageSize) {
        totalCount
        pageNumber
        pageSize
        items {
          id
          timestamp
          temperatureFahrenheit
          humidity
          pressure
          deviceId
          pm1_0
          pm2_5
          pm10_0
        }
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
        pm1_0
        pm2_5
        pm10_0
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

  getPaginatedReadings(pageNumber: number, pageSize: number): Observable<{ items: WeatherReading[]; totalCount: number; pageNumber: number; pageSize: number }> {
    return this.apollo
      .watchQuery<PaginatedReadingsResult>({
        query: this.GET_PAGINATED_READINGS,
        variables: { pageNumber, pageSize },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(
        map((r) => {
          const page = r.data?.paginatedReadings;
          const items = (page?.items ?? [])
            .map((item) => this.normalize(item as WeatherReadingRaw))
            .filter((reading): reading is WeatherReading => reading !== null);

          return {
            items,
            totalCount: page?.totalCount ?? 0,
            pageNumber: page?.pageNumber ?? pageNumber,
            pageSize: page?.pageSize ?? pageSize,
          };
        }),
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
