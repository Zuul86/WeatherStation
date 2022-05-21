import { Component } from '@angular/core';
import { Store } from '@ngxs/store';
import { UpdateTemperatureUnit } from './actions/update-temperature-unit.action';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(private store: Store){ }
  title = 'Weather Station';

  onTemperatureUnitChange(value: string) {
    this.store.dispatch(new UpdateTemperatureUnit(value));
  }
}