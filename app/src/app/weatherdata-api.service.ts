
import { Injectable } from "@angular/core";
import { Apollo, gql } from "apollo-angular";
import { map, Observable, mergeMap } from "rxjs";
import { WeatherDataModel } from "./features/weather-data-table/models/weather-data.model";
import { ApiResult } from "./features/weather-data-table/models/api-result.model";

@Injectable({
  providedIn: "root"
})
export class WeatherDataService {
  constructor(private apollo: Apollo){ }

  async GetWeatherData(time: number) {
    
  }
  ListWeatherData(filter:any, top:number): Observable<ApiResult<WeatherDataModel>>{
    let result;

    return this.apollo
      .watchQuery<{listWeatherData : { items: [{sensor_bp: any, sensor_h: any, sensor_t: any, time: any}]}}>({
        query: gql`
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
        `,
      })
      .valueChanges.pipe(map(x => { return { 
        data: x.data.listWeatherData.items.map(i => {
          return {
            barametricPressure: i.sensor_bp,
            tempurature: i.sensor_t,
            humidity: i.sensor_h,
            readingTime: new Date(x ? i.time * 1000: 0)
        };  
      }), isLoading: x.loading }}));
  }
}

