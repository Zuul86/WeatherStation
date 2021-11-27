import { Component, OnInit } from '@angular/core';
import { APIService, WeatherData } from './API.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'app';
  public weatherData: Array<WeatherDataModel> = [];

  constructor(private api: APIService){

  }

  async ngOnInit() {
    /* fetch restaurants when app loads */
    const result = await this.api.ListWeatherData();
    this.weatherData = result.items?.some ? result.items.map((x) => {
      return {...x, 
        time: new Date(x ? x.time * 1000: 0)
      } as WeatherDataModel;
    }) :  [];
  }
  
}

export type WeatherDataModel = {
  time: Date;
  sensor_bp?: number | null;
  sensor_t?: number | null;
  sensor_h?: number | null;
};
