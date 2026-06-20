import { Component, Input, OnDestroy } from '@angular/core';
import { Store } from '@ngxs/store';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-weather-dashboard-page',
  templateUrl: './weather-dashboard-page.component.html',
  styleUrls: ['./weather-dashboard-page.component.scss']
})
export class WeatherDashboardPageComponent implements OnDestroy {
  @Input() temperatureUnit: string = '';
  private subscription: Subscription;

  constructor(private store: Store) {
    this.subscription = this.store.select(state => state).subscribe(({ appSettings }) => {
      this.temperatureUnit = appSettings.temperatureUnit
    })
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
