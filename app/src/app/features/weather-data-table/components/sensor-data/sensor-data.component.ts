import { Component, Input, OnChanges } from '@angular/core';
import { WeatherDataService } from 'src/app/services/weatherdata-api.service';
import { WeatherDataModel } from '../../../../models/weather-data.model';

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

  constructor(private api: WeatherDataService){}

  private getTime(numberOfDaysAgo: number) : number {
    const now = new Date();
    now.setDate(now.getDate() - numberOfDaysAgo);
    return Math.floor(now.getTime() / 1000);
  }

  ngOnChanges() { 
    const thrityDaysAgo = this.getTime(30);
    
    this.api.ListWeatherData({time: {gt: thrityDaysAgo}}, 1000).subscribe(x => {
      this.weatherData = x.data;
    });
  }
}