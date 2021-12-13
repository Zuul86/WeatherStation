import { Component, OnInit } from '@angular/core';
import { APIService } from '../API.service';

@Component({
  selector: 'app-sensor-data-table',
  templateUrl: './sensor-data.component.html',
  styleUrls: ['./sensor-data.component.scss']
})
export class SensorDataComponent implements OnInit {
  title = 'Weather Station';
  
  displayedColumns: string[] = ['readingTime', 'sensor_t', 'sensor_h', 'sensor_bp'];
  weatherData: WeatherDataModel[] = [];

  constructor(private api: APIService){

  }

  private getTime(numberOfDaysAgo: number) : number {
    const now = new Date();
    now.setDate(now.getDate() - numberOfDaysAgo);
    return Math.floor(now.getTime() / 1000);
  }

  async ngOnInit() { 
    const thrityDaysAgo = this.getTime(30);

    const result = await this.api.ListWeatherData({time: {gt: thrityDaysAgo}}, 1000);
    this.weatherData = result.items?.some ? result.items.map((x) => {
      return {...x, 
        readingTime: new Date(x ? x.time * 1000: 0)
      };
    }) :  [];
  }
}

export interface WeatherDataModel {
  readingTime: Date;
  sensor_bp?: number | null;
  sensor_t?: number | null;
  sensor_h?: number | null;
};
