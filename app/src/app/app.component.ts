import { Component, OnInit } from '@angular/core';
import { APIService, WeatherData, TableWeatherDataFilterInput, TableIntFilterInput } from './API.service';

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

  private getTime(numberOfDaysAgo: number) : number {
    const now = new Date();
    now.setDate(now.getDate() - numberOfDaysAgo);
    return Math.floor(now.getTime() / 1000);
  }

  async ngOnInit() {
   
    const thrityDaysAgo = this.getTime(30);

    const result = await this.api.ListWeatherData({time: {gt: thrityDaysAgo}});
    this.weatherData = result.items?.some ? result.items.map((x) => {
      return {...x, 
        time: new Date(x ? x.time * 1000: 0)
      } as WeatherDataModel;
    }) :  [];
  }
  
}

export class myInput implements  TableWeatherDataFilterInput{

}

export type WeatherDataModel = {
  time: Date;
  sensor_bp?: number | null;
  sensor_t?: number | null;
  sensor_h?: number | null;
};
