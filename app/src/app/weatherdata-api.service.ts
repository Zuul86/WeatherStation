
import { Injectable } from "@angular/core";
import { Apollo, gql } from "apollo-angular";
import { map, Observable, mergeMap } from "rxjs";
import { WeatherDataModel } from "./models/weather-data.model";
import { ApiResult } from "./models/api-result.model";

const query = gql`
query MyQuery {
  listWeatherData {
    nextToken
    items {
      sensor_bp
      sensor_h
      sensor_t
      time
    }
  }
}
`;

type ListDataQueryResult = {
  listWeatherData: {
    items: [
      { sensor_bp: number, 
        sensor_h: number, 
        sensor_t: number, 
        time: number }
    ]
  }
}

@Injectable({
  providedIn: "root"
})
export class WeatherDataService {
  constructor(private apollo: Apollo) { }

  ListWeatherData(filter: any, top: number): Observable<ApiResult<WeatherDataModel>> {
    let result;

    return this.apollo
      .watchQuery<ListDataQueryResult>({ query })
      .valueChanges.pipe(map(x => {
        return {
          data: x.data.listWeatherData.items.map(i => {
            return {
              barametricPressure: i.sensor_bp,
              temperature: i.sensor_t,
              humidity: i.sensor_h,
              readingTime: new Date(x ? i.time * 1000 : 0)
            };
          }),
          isLoading: x.loading
        }
      }));
  }
}