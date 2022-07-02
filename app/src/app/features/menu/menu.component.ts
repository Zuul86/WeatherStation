import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent {

  constructor(private router: Router) { }

  onTemperatureUnitChange(value: string) {
    this.router.navigate(['/'], {
      state: {
        unit: value
      }
    })
  }
}
