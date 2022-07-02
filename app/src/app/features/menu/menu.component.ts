import { Component, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { UpdateTemperatureUnit } from 'src/app/actions/update-temperature-unit.action';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent {

  constructor(private store: Store) { }

  onTemperatureUnitChange(value: string) {
    this.store.dispatch(new UpdateTemperatureUnit(value));
  }
}
