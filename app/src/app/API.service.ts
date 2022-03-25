
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root"
})
export class APIService {
  async GetWeatherData(time: number) {
    
    
  }
  ListWeatherData(filter:any, top:number):{items:Array<{time: number, sensor_t: number}>}{
    return {items: []};
  }
}
