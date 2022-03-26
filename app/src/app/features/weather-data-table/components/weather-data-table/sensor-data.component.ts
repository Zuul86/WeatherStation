import { Component, Input, OnChanges } from '@angular/core';
import { WeatherDataService } from 'src/app/weatherdata-api.service';
import { WeatherDataModel } from '../../models/weather-data.model';

@Component({
  selector: 'app-sensor-data-table',
  templateUrl: './sensor-data.component.html',
  styleUrls: ['./sensor-data.component.scss']
})
export class SensorDataComponent implements OnChanges {
  @Input() temperatureUnit!: string;

  title = 'Weather Station';
  
  displayedColumns: string[] = ['readingTime', 'sensor_t', 'sensor_h', 'sensor_bp'];
  weatherData: WeatherDataModel[] = [];

  constructor(private api: WeatherDataService){

  }

  private getTime(numberOfDaysAgo: number) : number {
    const now = new Date();
    now.setDate(now.getDate() - numberOfDaysAgo);
    return Math.floor(now.getTime() / 1000);
  }

  private convertUnit(temperatureInCelcius: number | null | undefined) : number | null {
    const temp = this.temperatureUnit === "F" && temperatureInCelcius ? 
      (temperatureInCelcius * 1.8) + 32 : 
      temperatureInCelcius;

    return temp ? Math.round(temp) : null;
  }

  ngOnChanges() { 
    const thrityDaysAgo = this.getTime(30);
    
    const result = this.api.ListWeatherData({time: {gt: thrityDaysAgo}}, 1000);
    result.subscribe(x => {
      this.weatherData = x.data.map(i => {
        return {...i,
             sensor_t: this.convertUnit(i?.tempurature)
           }
          })
    });
    // this.weatherData = result.items?.length ? result.items.map((x: { time: number; sensor_t: number }) => {
    //   return {...x, 
    //     readingTime: new Date(x ? x.time * 1000: 0),
    //     sensor_t: this.convertUnit(x?.sensor_t)
    //   };
    // }) :  [];

  }
}