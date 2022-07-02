import { Component, Inject, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { UpdateTemperatureUnit } from 'src/app/actions/update-temperature-unit.action';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent {

  constructor(private store: Store, public dialog: MatDialog) { }

  onTemperatureUnitChange(value: string) {
    this.store.dispatch(new UpdateTemperatureUnit(value));
  }
}