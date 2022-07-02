import { Component } from '@angular/core';
import { Store } from '@ngxs/store';

@Component({
  selector: 'app-weather-dashboard-page',
  templateUrl: './weather-dashboard-page.component.html',
  styleUrls: ['./weather-dashboard-page.component.scss']
})
export class WeatherDashboardPageComponent {

  constructor(private store: Store) { }

}
